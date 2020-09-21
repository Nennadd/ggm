module.exports = {
  user: process.env.USER,
  password: process.env.PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB,
  stream: false,
  driver: "tedious",
  options: {
    port: process.env.DB_PORT,
    encrypt: false,
    enableArithAbort: true,
  },
};
