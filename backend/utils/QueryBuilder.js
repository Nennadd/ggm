const { getConnection, sql } = require("./database");

class Query {
  static async getAll() {
    const pool = await getConnection();
    const request = await pool.request();
    return await request.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, 
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
  }

  static async searchByDate(data) {
    const { dateFrom, dateTo } = data;
    const pool = await getConnection();
    const request = await pool.request();

    request.input("dateFrom", sql.VarChar, dateFrom);
    request.input("dateTo", sql.VarChar, dateTo);

    return await request.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier,
    RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand,

    (SELECT sum(RDR1.Price) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode
    JOIN OCRD on OITM.CardCode = OCRD.CardCode
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between @dateFrom AND @dateTo) as TotalPrice,

    (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode
    JOIN OCRD on OITM.CardCode = OCRD.CardCode
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between @dateFrom AND @dateTo) as SumOfArticles,

    (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float))
    FROM RDR1
    JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry
    JOIN OITM on OITM.ItemCode = RDR1.ItemCode
    JOIN OCRD on OITM.CardCode = OCRD.CardCode
    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between @dateFrom AND @dateTo) as AvgArticleByOrder

    FROM OITM
    JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode
    JOIN OCRD on OITM.CardCode = OCRD.CardCode
    JOIN ORDR on ORDR.DocEntry = RDR1.DocEntry

    WHERE OCRD.CardType = 'S' AND ORDR.DocDate between @dateFrom AND @dateTo
    GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
  }

  static async searchBySupplier(supplier) {
    if (supplier === "all") {
      return await this.getAll();
    } else {
      const pool = await getConnection();
      const request = await pool.request();
      request.input("supplier", sql.VarChar, supplier);

      return await request.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier,
          RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand,

          (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode JOIN OCRD on OITM.CardCode = OCRD.CardCode
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = @supplier) as TotalPrice,

          (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode
          JOIN OCRD on OITM.CardCode = OCRD.CardCode
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = @supplier ) as SumOfArticles,

          (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float))
          FROM RDR1
          JOIN OITM on OITM.ItemCode = RDR1.ItemCode
          JOIN OCRD on OITM.CardCode = OCRD.CardCode
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = @supplier ) as AvgArticleByOrder

          FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode
          JOIN OCRD on OITM.CardCode = OCRD.CardCode
          WHERE OCRD.CardType = 'S' AND OCRD.CardName = @supplier
          GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
    }
  }

  static async searchByPayment(payment) {
    if (payment === "all") {
      return await this.getAll();
    } else {
      const pool = await getConnection();
      const request = await pool.request();
      // request.input("payment", sql.VarChar, payment);
      return await request.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier, RDR1.Price, OITM.onHand, count(RDR1.ItemCode)  as ArticleInOrders,

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
    const { itemCode, itemName } = await data;

    const pool = await getConnection();
    const request = await pool.request();

    request.input("itemCode", sql.VarChar, itemCode);
    request.input("itemName", sql.VarChar, itemName);

    return await request.query(`SELECT OITM.ItemCode, OITM.ItemName, OCRD.CardName as Supplier,
        RDR1.Price, count(RDR1.ItemCode) as ArticleInOrders, OITM.onHand,

        (SELECT sum(RDR1.Price) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode
        WHERE OITM.ItemCode LIKE '%${itemCode}%' OR OITM.ItemName LIKE '%${itemName}%' ) as TotalPrice,

        (SELECT count(RDR1.ItemCode) FROM RDR1 JOIN OITM on OITM.ItemCode = RDR1.ItemCode
        JOIN OCRD on OITM.CardCode = OCRD.CardCode
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${itemCode}%' OR OITM.ItemName LIKE '%${itemName}%' ) as SumOfArticles,

        (SELECT (cast(count(RDR1.ItemCode) as float) / cast(count(DISTINCT RDR1.ItemCode) as float))
        FROM RDR1
        JOIN OITM on OITM.ItemCode = RDR1.ItemCode
        JOIN OCRD on OITM.CardCode = OCRD.CardCode
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${itemCode}%' OR OITM.ItemName LIKE '%${itemName}%' ) as AvgArticleByOrder

        FROM OITM JOIN RDR1 on OITM.ItemCode = RDR1.ItemCode
        JOIN OCRD on OITM.CardCode = OCRD.CardCode
        WHERE OCRD.CardType = 'S' AND OITM.ItemCode LIKE '%${itemCode}%' OR OITM.ItemName LIKE '%${itemName}%'
        GROUP BY OITM.ItemCode, OITM.ItemName, OCRD.CardName, RDR1.Price, OITM.onHand`);
  }
}

module.exports = Query;
