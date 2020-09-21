const http = require("http");
require("dotenv").config();
const PORT = process.env.PORT || 3000;

// NOTE Server !!!
const server = http.createServer((req, res) => {});
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// NOTE WebSocket !!!
const socket = require("./socket")(server);

// NOTE MSSQL !!!
const db = require("mssql");
const config = require("./config");
(async () => {
  try {
    await db.connect(config);
    const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, 
    count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
    (SELECT sum(RDR1.Price) FROM RDR1) as TotalPrice, 
    
    (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S' ) as SumOfArticles
    
    FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S'
    GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
    // console.log(result);

    await socket.on("connect", (ws) => {
      console.log("Connected !!!");
      let data = [];
      result.recordset.forEach((record) => {
        data.push(record);
      });

      ws.on("message", async (req) => {
        let response = [];
        const data = JSON.parse(req.utf8Data);

        if (data.supplier) {
          const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
          RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

          (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode JOIN OCRD on OITM.CardCode = OCRD.CardCode 
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${data.supplier}') as TotalPrice 
          
          FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
          JOIN OCRD on OITM.CardCode = OCRD.CardCode 
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${data.supplier}'
          GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);

          result.recordset.forEach((record) => {
            response.push(record);
          });

          ws.send(JSON.stringify(response));
          return;
        }

        if (data.itemCode || data.itemName) {
          const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
          RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
            (SELECT sum(RDR1.Price) FROM RDR1) as TotalPrice, 
            
            (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            WHERE OCRD.CardType = 'S' ) as SumOfArticles
            
            FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            WHERE OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%'
            GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);

          result.recordset.forEach((record) => {
            response.push(record);
          });

          ws.send(JSON.stringify(response));
          return;
        }
        if (!data.itemCode && !data.itemName) {
          const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, 
          count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
          (SELECT sum(RDR1.Price) FROM RDR1) as TotalPrice, 
          
          (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
          JOIN OCRD on OITM.CardCode = OCRD.CardCode 
          WHERE OCRD.CardType = 'S' ) as SumOfArticles
          
          FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
          JOIN OCRD on OITM.CardCode = OCRD.CardCode 
          WHERE OCRD.CardType = 'S'
          GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);

          result.recordset.forEach((record) => {
            response.push(record);
          });

          ws.send(JSON.stringify(response));
          return;
        }
      });

      ws.send(JSON.stringify(data));
    });
  } catch (error) {
    console.log(error.message);
  }
})();

// socket.on("request", (request) => {
//   let connection = request.accept(null, "*");
//   connection.on("message", (message) => {
//     console.log(message);
//   });
// });

socket.on("close", () => {
  console.log("Disconnected !!!");
});
