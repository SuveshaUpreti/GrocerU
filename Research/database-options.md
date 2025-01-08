
# Database Options

## Server-based (DBMS) vs. Flat File (SQLite)

| Feature                     | Server-Based Database                    | Flat-File Database              |
|-----------------------------|------------------------------------------|---------------------------------|
| Architecture                | Client-server architecture (remote access). | Single file stored locally (no network access). |
| Concurrency                 | Supports multiple simultaneous users.    | Limited or no support for concurrent writes. |
| Scalability                 | Easily scalable to handle large datasets. | Not suitable for large-scale applications. |
| Security                    | Advanced security features (user roles, encryption). | Minimal or no security features built-in. |
| Setup Complexity            | Requires configuration and management of a server. | Simple setup with a single file. |
| Data Integrity              | Strong guarantees for consistency (ACID properties). | Limited data integrity and consistency. |
| Data Access                 | Accessed over the network via a database server. | Directly accessed as a file on disk. |
| Performance                 | Optimized for handling complex queries and large datasets. | Suitable for small amounts of data, not optimized for performance. |
| Examples                    | MySQL, PostgreSQL, MongoDB, SQL Server. | CSV, JSON, SQLite. |

## Choose a Server-Based Database If:
- You need to support multiple users or have complex data relationships.
- Your application will grow and needs to handle large datasets.
- You require advanced features like transactions, security, and scalability.

## Choose a Flat-File Database If:
- You’re building a ***small, simple application with few users***.
- You need a ***quick and easy setup*** with no server overhead.
- You’re prototyping, building local applications, or ***working on a class project with minimal data***.

## Install & workflow documentation for SQlite:
- [Install SQLite on Windows](https://www.sqlite.org/download.html)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)