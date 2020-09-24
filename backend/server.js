const http = require("http");
const fs = require("fs");
const fastCsv = require("fast-csv");
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

    // NOTE Get all !!!
    const getAll = async () => {
      return await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, 
      count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
      (SELECT sum(RDR1.Price) FROM RDR1) as TotalPrice, 
            
      (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
      JOIN OCRD on OITM.CardCode = OCRD.CardCode 
      WHERE OCRD.CardType = 'S' ) as SumOfArticles,
      
      (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float)) FROM RDR1 
      JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
      JOIN OCRD on OITM.CardCode = OCRD.CardCode 
      WHERE OCRD.CardType = 'S' ) as AvgArticleByOrder
            
      FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
      JOIN OCRD on OITM.CardCode = OCRD.CardCode 
      WHERE OCRD.CardType = 'S'
      GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
    };
    const result = await getAll();

    await socket.on("connect", (ws) => {
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
          const result = await getAll();

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
          const date = new Date();
          const csvFilePath = "csv/file-" + date.getTime() + ".csv";
          const csv = fs.createWriteStream(csvFilePath);
          fastCsv
            .write(csvData, { headers: true })
            .on("finish", () => {
              ws.send(JSON.stringify({ type: "csv", path: csvFilePath }));
            })
            .pipe(csv);
        }

        // NOTE Search by date !!!
        if (data.type === "form") {
          const { dateFrom, dateTo } = data;

          const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
          RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

          (SELECT sum(RDR1.Price) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
          WHERE ORDR.DocDate between '${dateFrom}' AND '${dateTo}') as TotalPrice, 
                    
          (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
          WHERE ORDR.DocDate between '${dateFrom}' AND '${dateTo}') as SumOfArticles FROM OITM 
          
          JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
          JOIN OCRD on OITM.CardCode = OCRD.CardCode 
          JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
          
          WHERE OCRD.CardType = 'S' AND ORDR.DocDate between '${dateFrom}' AND '${dateTo}'
          GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);

          result.recordset.forEach((record) => {
            response.push(record);
          });

          ws.send(JSON.stringify(response));
          return;
        }

        // NOTE Search by Supplier !!!
        if (data.supplier) {
          let result;
          if (data.supplier === "all") {
            result = await getAll();
          } else {
            result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
            RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
  
            (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${data.supplier}') as TotalPrice 
            
            FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${data.supplier}'
            GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
          }
          result.recordset.forEach((record) => {
            response.push(record);
          });
          ws.send(JSON.stringify(response));
          return;
        }

        // NOTE Payment !!!
        if (data.payment) {
          let result;
          if (data.payment === "all") {
            result = await getAll();
          } else {
            result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
            RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
            
            (SELECT sum(RDR1.Price) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
            JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
            WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${data.payment} ORDR.DocTotal ) as TotalPrice, 
                      
            (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            WHERE OCRD.CardType = 'S' ) as SumOfArticles FROM OITM 
            
            JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
            JOIN OCRD on OITM.CardCode = OCRD.CardCode 
            JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
            JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
            
            WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${data.payment} ORDR.DocTotal 
            GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
          }
          result.recordset.forEach((record) => {
            response.push(record);
          });
          ws.send(JSON.stringify(response));
          return;
        }

        // NOTE ItemCode & ItemName autocomplete !!!
        if (data.itemCode || data.itemName) {
          const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
          RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

            (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
            WHERE OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%') as TotalPrice, 
            
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
          const result = await getAll();

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

socket.on("close", () => {
  console.log("Disconnected !!!");
});
