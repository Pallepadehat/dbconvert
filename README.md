# 🗄️ SQLite to SQL Exporter

A simple, fast CLI tool that converts SQLite databases to standard SQL files that can be imported into any SQL database system.

## 🎯 What it does

This tool reads your SQLite database (`.db`, `.sqlite`, `.sqlite3` files) and generates a standard SQL file containing:

- **CREATE TABLE** statements with proper data types
- **INSERT** statements with all your data
- **Primary keys** and **constraints**
- **Proper SQL formatting** for maximum compatibility

## 🔄 What it converts

**FROM:** SQLite databases (`.db`, `.sqlite`, `.sqlite3`)  
**TO:** Standard SQL files (`.sql`) compatible with:

- ✅ MySQL / MariaDB
- ✅ PostgreSQL
- ✅ SQL Server
- ✅ Oracle Database
- ✅ Any SQL database system

## 🚀 Quick Start

### Installation

Make sure you have [Bun](https://bun.sh) installed, then:

```bash
bun install
```

### Basic Usage

```bash
# Convert your database (creates <filename>_export.sql)
bun run index.ts your-database.db

# Specify custom output file
bun run index.ts your-database.db output.sql

# Export to different directory
bun run index.ts database.db ./backups/backup.sql
```

### Get Help

```bash
bun run index.ts --help
```

## 📋 Examples

```bash
# Export panoptikon.db to panoptikon_export.sql
bun run index.ts panoptikon.db

# Create a backup in the backups folder
bun run index.ts products.db ./backups/products_backup.sql

# Convert any SQLite file
bun run index.ts /path/to/mydata.sqlite3 converted.sql
```

## ✨ Features

- 🎯 **Zero configuration** - Just point it at your SQLite file
- 🔄 **Smart type conversion** - Converts SQLite types to standard SQL types
- 📁 **Auto directory creation** - Creates output directories if needed
- ✅ **File validation** - Checks input files before processing
- 📊 **Progress feedback** - Shows what's happening during export
- 💾 **Memory efficient** - Handles large databases without issues
- 🛡️ **Data safety** - Properly escapes strings and handles special characters

## 🔧 Data Type Conversion

| SQLite Type  | Converted To    | Notes                                  |
| ------------ | --------------- | -------------------------------------- |
| `INTEGER`    | `INT`           | With `AUTO_INCREMENT` for primary keys |
| `TEXT`       | `TEXT`          | Preserves all text content             |
| `REAL`       | `DECIMAL(10,2)` | For decimal numbers                    |
| `BLOB`       | `BLOB`          | Binary data                            |
| `VARCHAR(n)` | `VARCHAR(n)`    | Preserves length constraints           |

## 📤 Using the exported SQL

Once you have your `.sql` file, you can import it into any database:

### MySQL/MariaDB

```bash
mysql -u username -p database_name < exported_file.sql
```

### PostgreSQL

```bash
psql -U username -d database_name -f exported_file.sql
```

### Using database tools

- **phpMyAdmin**: Use the Import tab
- **Adminer**: Use the SQL command or Import feature
- **DBeaver**: Right-click database → Execute SQL Script

## 🏗️ Example Output

Your SQLite database:

```
panoptikon.db (contains products table)
```

Generated SQL file:

```sql
-- Exported from SQLite database
-- Generated on 2024-01-15T10:30:00.000Z

-- Table: produkter
CREATE TABLE `produkter` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `navn` TEXT NOT NULL,
  `beskrivelse` TEXT,
  `pris` DECIMAL(10,2) NOT NULL,
  `lager` INT,
  `billede_url` TEXT
);

-- Data for table: produkter
INSERT INTO `produkter` (`id`, `navn`, `beskrivelse`, `pris`, `lager`, `billede_url`) VALUES (1, 'Lydklip: Ugle tuder', 'Lydoptagelse af en ugle. Uden musik. Ca. 2 min.', 59.95, 3, NULL);
INSERT INTO `produkter` (`id`, `navn`, `beskrivelse`, `pris`, `lager`, `billede_url`) VALUES (2, 'Skole-tv intro (1979)', 'Den klassiske introsekvens med synth-lyde og stjerneregn.', 89.00, 7, NULL);
-- ... more data rows
```

## 🛠️ Development

Built with:

- **TypeScript** for type safety
- **Bun** for fast JavaScript runtime
- **sqlite3** for database reading
- **Node.js fs** for file operations

## 📝 License

This project is open source and available under the MIT License.

---

**Happy database converting! 🎉**
