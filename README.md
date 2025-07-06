### Setup Instructions

Prerequisites:

- Node.js
- PostgreSQL
- Redis
- Yarn

1. Clone the Repository
   `git clone https://github.com/Ndumatt1/patis-assessment.git`
   `cd patis-assessment`
2. Install dependencies
   `yarn install`
3. Configure Environment
   Copy .env.example to .env and fill in your database and Redis credentials:
   ```DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=yourpassword
   DB_DATABASE=wallet_db
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_jwt_secret
   ```
4. Run Database Migrations
   `yarn db:migrate`
5. Start the aapplication
   `yarn start:dev`

### Docker Deployment

Run `bash deploy.sh` in the project root directly after following step 3 above by setting environment variables

### Endpoint Documentation

https://documenter.getpostman.com/view/35598695/2sB34cohHv

### Assumptions Made

- Each user can have only one wallet. This is enforced by checking for an existing wallet before creation in the service logic.
- Wallet balances are stored as strings/decimals in the database to avoid floating-point precision errors, as seen in the entity definitions and transaction logic.
- All monetary operations (deposit, withdraw, transfer) are wrapped in database transactions with pessimistic locking to ensure concurrency safety and prevent race conditions or deadlocks.
- Transaction references (UUIDs) are used for idempotency, especially for transfers, to prevent duplicate processing of the same transaction.
- Withdrawals and transfers are queued and processed asynchronously using BullMQ, allowing for retry logic and decoupling of API response from transaction processing.
- Redis is used for caching transaction histories and can be extended to cache wallet balances for fast reads. Cache invalidation is performed after updates to ensure consistency.
- API rate limiting is enabled using @nestjs/throttler to protect wallet operations from abuse.
- The system is designed to be modular, with clear separation of concerns between modules (wallet, auth, worker, etc.).
- Postman is used for API documentation, and Jest is used for unit and integration testing.
- Docker is used for containerization and easy deployment.
