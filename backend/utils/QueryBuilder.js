const pool = require("./database");

class Query {
  static async getAll() {
    const db = await pool;
    const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, 
    count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 
    
    (SELECT sum(RDR1.Price) FROM RDR1 
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S') as TotalPrice, 
          
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

    return result;
  }

  static async searchByDate(data) {
    const db = await pool;
    const { dateFrom, dateTo } = data;
    const result = await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
    RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

    (SELECT sum(RDR1.Price) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between '${dateFrom}' AND '${dateTo}') as TotalPrice, 
              
    (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between '${dateFrom}' AND '${dateTo}') as SumOfArticles,
    
    (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float)) 
    FROM RDR1 
    JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between '${dateFrom}' AND '${dateTo}') as AvgArticleByOrder 
    
    FROM OITM 
    JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
    JOIN OCRD on OITM.CardCode = OCRD.CardCode 
    JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
    
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between '${dateFrom}' AND '${dateTo}'
    GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);

    return result;
  }

  static async searchBySupplier(supplier) {
    const db = await pool;
    if (supplier === "all") {
      return await this.getAll();
    } else {
      return await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
        RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

        (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${supplier}') as TotalPrice, 

        (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${supplier}' ) as SumOfArticles,

        (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float)) 
        FROM RDR1 
        JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${supplier}' ) as AvgArticleByOrder
        
        FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OCRD.CardName = '${supplier}'
        GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
    }
  }

  static async searchByPayment(payment) {
    const db = await pool;
    if (payment === "all") {
      return await this.getAll();
    } else {
      return await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, OITM.onHand, count(RDR1.ItemCode)  as ArticleInOrders,
                    
        (SELECT sum(RDR1.Price) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
        JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
        WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${payment} ORDR.DocTotal ) as TotalPrice, 
                              
        (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
        JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
        WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${payment} ORDR.DocTotal ) as SumOfArticles,

        (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float)) 
        FROM RDR1 
        JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
        JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
        WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${payment} ORDR.DocTotal) as AvgArticleByOrder

        FROM OITM 
        JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry 
        JOIN [@BOB_ORDR] on ORDR.DocEntry = [@BOB_ORDR].DocEntry 
                    
        WHERE OCRD.CardType = 'S' AND [@BOB_ORDR].Zahlbetrag ${payment} ORDR.DocTotal 
        GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
    }
  }

  static async searchByItemCodeOrName(data) {
    const db = await pool;
    return await db.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, 
        RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand, 

        (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        WHERE OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%') as TotalPrice, 
        
        (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%' ) as SumOfArticles, 

        (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float)) 
        FROM RDR1 
        JOIN OITM on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%') as AvgArticleByOrder
        
        FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode 
        JOIN OCRD on OITM.CardCode = OCRD.CardCode 
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${data.itemCode}%' OR OITM.ItemName LIKE '%${data.itemName}%'
        GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
  }
}

module.exports = Query;
