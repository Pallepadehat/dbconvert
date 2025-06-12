#!/usr/bin/env ts-node

import sqlite3 from "sqlite3";
import { promises as fs } from "fs";
import path from "path";

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

class SQLiteToSQLExporter {
  private db: sqlite3.Database;
  private outputFile: string;

  constructor(dbPath: string, outputFile: string = "export.sql") {
    this.db = new sqlite3.Database(dbPath);
    this.outputFile = outputFile;
  }

  async export(): Promise<void> {
    console.log("🚀 Exporting SQLite database to SQL file...");

    const sqlStatements: string[] = [];

    // Add header comment
    sqlStatements.push("-- Exported from SQLite database");
    sqlStatements.push(`-- Generated on ${new Date().toISOString()}`);
    sqlStatements.push("");

    // Get all tables
    const tables = await this.getTables();
    console.log(`📋 Found ${tables.length} tables to export`);

    for (const tableName of tables) {
      console.log(`📝 Exporting table: ${tableName}`);

      // Add table comment
      sqlStatements.push(`-- Table: ${tableName}`);

      // Get CREATE TABLE statement
      const createTableSQL = await this.getCreateTableSQL(tableName);
      sqlStatements.push(createTableSQL);
      sqlStatements.push("");

      // Get and add INSERT statements
      const insertStatements = await this.getInsertStatements(tableName);
      if (insertStatements.length > 0) {
        sqlStatements.push(`-- Data for table: ${tableName}`);
        sqlStatements.push(...insertStatements);
        sqlStatements.push("");
      }
    }

    // Write to file
    const sqlContent = sqlStatements.join("\n");
    await fs.writeFile(this.outputFile, sqlContent, "utf-8");

    console.log(`✅ Export completed! File saved as: ${this.outputFile}`);
    console.log(`📊 Total lines: ${sqlStatements.length}`);
  }

  private async getTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;

      this.db.all(query, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row) => row.name));
      });
    });
  }

  private async getCreateTableSQL(tableName: string): Promise<string> {
    // Get column information
    const columns = await this.getColumnInfo(tableName);

    // Build CREATE TABLE statement
    const columnDefs = columns.map((col) => {
      let def = `  \`${col.name}\``;

      // Convert SQLite types to more standard SQL types
      let sqlType = this.convertSQLiteType(col.type);
      def += ` ${sqlType}`;

      // Add constraints
      if (col.notnull && !col.pk) {
        def += " NOT NULL";
      }

      if (col.pk) {
        def += " PRIMARY KEY";
        if (col.type.toLowerCase().includes("integer")) {
          def += " AUTO_INCREMENT";
        }
      }

      if (col.dflt_value !== null) {
        def += ` DEFAULT ${col.dflt_value}`;
      }

      return def;
    });

    return `CREATE TABLE \`${tableName}\` (\n${columnDefs.join(",\n")}\n);`;
  }

  private async getColumnInfo(tableName: string): Promise<ColumnInfo[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${tableName})`, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows as ColumnInfo[]);
      });
    });
  }

  private async getInsertStatements(tableName: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${tableName}`, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        if (rows.length === 0) {
          resolve([]);
          return;
        }

        const statements: string[] = [];
        const columns = Object.keys(rows[0]);
        const columnList = columns.map((col) => `\`${col}\``).join(", ");

        for (const row of rows) {
          const values = columns
            .map((col) => {
              const value = row[col];
              if (value === null) return "NULL";
              if (typeof value === "string") {
                // Escape single quotes in strings
                return `'${value.replace(/'/g, "''")}'`;
              }
              return value;
            })
            .join(", ");

          statements.push(
            `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});`
          );
        }

        resolve(statements);
      });
    });
  }

  private convertSQLiteType(sqliteType: string): string {
    const type = sqliteType.toLowerCase();

    if (type.includes("int")) return "INT";
    if (type.includes("text")) return "TEXT";
    if (
      type.includes("real") ||
      type.includes("float") ||
      type.includes("double")
    )
      return "DECIMAL(10,2)";
    if (type.includes("blob")) return "BLOB";
    if (type.includes("char")) return sqliteType.toUpperCase();
    if (type.includes("varchar")) return sqliteType.toUpperCase();

    // Default to TEXT for unknown types
    return "TEXT";
  }

  close(): void {
    this.db.close();
  }
}

function showHelp(): void {
  console.log(`

Usage:
  bun run index.ts <sqlite-file> [output-file]
  bun run index.ts --help

Arguments:
  <sqlite-file>    Path to the SQLite database file (.db)
  [output-file]    Optional output SQL file path (default: same name as input with .sql extension)

Examples:
  bun run index.ts my-database.db
  bun run index.ts ./data/products.db ./exports/products.sql
  bun run index.ts panoptikon.db ./output/backup.sql

Options:
  --help, -h       Show this help message
`);
}

function parseArgs(): { inputFile: string; outputFile: string } | null {
  const args = process.argv.slice(2);

  // Show help
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    return null;
  }

  if (args.length < 1) {
    console.error("❌ Error: Please provide a SQLite database file");
    showHelp();
    return null;
  }

  const inputFile = args[0];

  // Generate default output file if not provided
  let outputFile = args[1];
  if (!outputFile) {
    const parsedPath = path.parse(inputFile);
    outputFile = path.join(parsedPath.dir, `${parsedPath.name}_export.sql`);
  }

  return { inputFile, outputFile };
}

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log("🗄️  SQLite to SQL Exporter CLI");
  console.log("===============================\n");

  // Parse command line arguments
  const args = parseArgs();
  if (!args) {
    process.exit(0);
  }

  const { inputFile, outputFile } = args;

  try {
    // Check if input file exists
    if (!(await checkFileExists(inputFile))) {
      console.error(`❌ Error: SQLite file '${inputFile}' not found`);
      process.exit(1);
    }

    // Check if input file is readable
    try {
      const stats = await fs.stat(inputFile);
      if (!stats.isFile()) {
        console.error(`❌ Error: '${inputFile}' is not a file`);
        process.exit(1);
      }
    } catch (error) {
      console.error(
        `❌ Error: Cannot access file '${inputFile}': ${
          (error as Error).message
        }`
      );
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (outputDir && outputDir !== ".") {
      await fs.mkdir(outputDir, { recursive: true });
    }

    console.log(`📂 Input file:  ${path.resolve(inputFile)}`);
    console.log(`📄 Output file: ${path.resolve(outputFile)}\n`);

    // Start the export
    const exporter = new SQLiteToSQLExporter(inputFile, outputFile);
    await exporter.export();
    exporter.close();

    console.log("\n🎉 SQL export completed successfully!");
    console.log(`📂 Output saved to: ${path.resolve(outputFile)}`);
    console.log(`📊 File size: ${(await fs.stat(outputFile)).size} bytes`);
    console.log("\nYou can now import this SQL file into your database! 🚀");
  } catch (error) {
    console.error("\n❌ Export failed:", (error as Error).message);
    console.error("💡 Make sure the SQLite file is valid and not corrupted.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SQLiteToSQLExporter };
