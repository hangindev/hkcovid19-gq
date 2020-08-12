# The Hong Kong Covid-19 API

The Hong Kong Covid-19 API is a GraphQL endpoint based on the data provided in [DATA.GOV.HK](https://data.gov.hk/en-data/dataset/hk-dh-chpsebcddr-novel-infectious-agent). You will access to data about the details of cases of COVID-19 infection, buildings in which cases have resided or visited and large clusters with 10 or more cases.

## GraphQL

**Endpoint/Playground: [https://hkcovid19.gq](https://hkcovid19.gq)**

There are 6 queries in total: `case`, `cases`, `building`, `buildings`, `cluster`, and `clusters`.
The singular field has a required primary key argument and is used to look up a specific record while the plural field returns all records of that type by default, but includes an optional argument that can be used to filter and order the results.

> New to GraphQl? check the [docs](https://graphql.org/learn/)

Here are some examples:

```graphql
# Query all cases since August and the related buildings
query {
  cases(
    orderBy: { reportDate: asc }
    where: { reportDate: { gte: "2020-08-01T00:00:00Z" } }
  ) {
    id
    age
    gender
    reportDate
    status
    buildings {
      name
      district
    }
  }
}
```

```graphql
# Query a specific building with its address (name + district), and get all the relatedCases
query {
  building(
    where: {
      address: { name: "Grand Plaza Tao Heung", district: YAU_TSIM_MONG }
    }
  ) {
    name
    relatedCases {
      id
      age
      status
    }
  }
}
```

## Data Source

All data is collected from the CSV files providied in [DATA.GOV.HK](https://data.gov.hk/en-data/dataset/hk-dh-chpsebcddr-novel-infectious-agent) and resolved to match the GraphQL schema.
A cron job is set up to check for updates every hour. Since the data scraping is an on going process, additional fields (e.g. date of admission/discharge/decease) can be derived by comparing the latest patient's status and his/her status the day before. But since these fields are derived, they are less accurate.

To learn about how the raw data is transformed, check out the resolver files in the `lib` folder. The data is stored in a PostgreSQL Database. You can check the full database schema in [schema.prisma](https://github.com/hangindev/hkcovid19-gq/blob/master/prisma/schema.prisma).

## Contribute

Pull requests and feedback are welcome. Support this repo by giving it a 🌟. 😉

## Development

The server and GraphQL API are built with [Nexus](https://nexusjs.org/) and [Prisma](https://www.prisma.io/). Nexus is a Node.js TypeScript-focused code-first GraphQL framework. To learn about what that means, check out [Nexus tutorial](https://nexusjs.org/).
Once you have a general idea of the Nexus workflow and want to spin up your own hkcovid19 server, here are the steps to get you started, note that you should be developing in a Linux enviroment (e.g. MacOS or Windows Subsystem for Linux):

1. Clone this repo with `git clone https://github.com/hangindev/hkcovid19-gq.git`.

2. Install the dependencies with `npm install` or `yarn`.

3. Set up a PostgreSQL Database. You can set up a local database(recommended) or [get a free hosted PostgreSQL database on Heroku](https://dev.to/prisma/how-to-setup-a-free-postgresql-database-on-heroku-1dc1).

4. Create a `.env` file in the `prisma` directory and add your database connection url to it:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
```

5. Start dev server with `npm run dev`. When you are developing with `Nexus`, it is recommended to keep the dev server running to get the best static typing experience.

6. Create the database tables with Prisma Migrate: [reference](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch-prisma-migrate-typescript-postgres#create-database-tables-with-prisma-migrate)

```sh
npx prisma migrate save --name init --experimental
npx prisma migrate up --experimental
```

7. Seed the database. Open up a different terminal and run:

```sh
npm run seed
```

8. Now you should be able to visit `http://localhost:4000` and start querying data.

9. If at any moment you want to clear the database, you may run:

```sh
npm run blowitallaway
```

## License

MIT License
