const http = require("http");
require("dotenv").config();
const PORT = process.env.PORT || 3000;

const Query = require("./utils/QueryBuilder");

// NOTE Server !!!
const server = http.createServer((req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
});
  // NOTE WebSocket !!!
  const socket = require("./socket")(server);

  (async () => {
    try {
      // NOTE Get all !!!
      const result = await Query.getAll();

      socket.on("connect", (ws) => {
        console.log("Connected !!!");
        let data = [];
        result.recordset.forEach((record) => {
          data.push(record);
        });

        ws.on("message", async (req) => {
          let response = [];

          const data = JSON.parse(req.utf8Data);

          // NOTE Expot .csv !!!
          if (data.type === "csv") {
            const result = await Query.getAll();

            const csvData = [];
            result.recordset.forEach((record) => {
              csvData.push({
                ItemCode: record.ItemCode,
                ItemName: record.ItemName,
                Supplier: record.Supplier,
                Price: record.Price,
                ArticleInOrders: record.ArticleInOrders,
                AverageArticlesByOrder: record.AverageArticlesByOrder,
                Warehouse: record.onHand,
              });
            });

            return ws.send(
              JSON.stringify({
                type: "csv",
                data: csvData,
              })
            );
          }

          // NOTE Search by date !!!
          if (data.type === "form") {
            const result = await Query.searchByDate(data);

            result.recordset.forEach((record) => {
              response.push(record);
            });

            return ws.send(JSON.stringify(response));
          }

          // NOTE Search by Supplier !!!
          if (data.supplier) {
            const result = await Query.searchBySupplier(data.supplier);

            result.recordset.forEach((record) => {
              response.push(record);
            });
            return ws.send(JSON.stringify(response));
          }

          // NOTE Payment !!!
          if (data.payment) {
            const result = await Query.searchByPayment(data.payment);

            result.recordset.forEach((record) => {
              response.push(record);
            });
            return ws.send(JSON.stringify(response));
          }

          // NOTE ItemCode & ItemName autocomplete !!!
          if (data.itemCode || data.itemName) {
            const result = await Query.searchByItemCodeOrName(data);

            result.recordset.forEach((record) => {
              response.push(record);
            });

            return ws.send(JSON.stringify(response));
          }

          if (!data.itemCode && !data.itemName) {
            const result = await Query.getAll();

            result.recordset.forEach((record) => {
              response.push(record);
            });

            return ws.send(JSON.stringify(response));
          }
        });

        return ws.send(JSON.stringify(data));
      });
    } catch (error) {
      console.log(error.message);
    }
  })();

  socket.on("close", () => {
    console.log("Disconnected !!!");
  });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
