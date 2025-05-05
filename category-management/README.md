# Multi Level Category Management

### Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/category-management.git
   cd <category-management>
   ```

2. Install dependencies

```bash
  npm install
```

4. Set up environment v[Insert Postman link here]ariables:

   ```bash
   cp .env.sample .env
   # Edit .env file with your configuration
   ```

5. Compile the project and create build

```
  tsc or npm run build

```

6. Start the project

```
npm start

```

### Docker Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ct.git
   cd <category-management>
   ```

2. Run docker service using

   ```bash
   docker-compose up -d
   ```

3. The API will be available at `http://localhost:3000` (or the port specified in env)
