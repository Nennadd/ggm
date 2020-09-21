const getElement = (el) => document.querySelector(el);

const select = getElement("#suppliers");
const suppliers = new Set();
const tbody = getElement("tbody");

// NOTE Render Table !!!
const render = (result, socket) => {
  tbody.innerHTML = "";
  result.forEach((item) => {
    const tr = document.createElement("tr");

    const tdItemCode = document.createElement("td");
    tdItemCode.textContent = item.ItemCode;

    const tdItemName = document.createElement("td");
    tdItemName.textContent = item.ItemName;

    const tdSupplier = document.createElement("td");
    tdSupplier.textContent = item.Supplier || "/";
    suppliers.add(item.Supplier);

    const tdPrice = document.createElement("td");
    tdPrice.innerHTML = item.Price + " &euro;" || "/";

    const tdOrders = document.createElement("td");
    tdOrders.textContent = item.ArticleInOrders || "/";

    const tdAverage = document.createElement("td");
    tdAverage.textContent = item.average || "/";

    const tdInWarehouse = document.createElement("td");
    tdInWarehouse.textContent = item.onHand || "/";

    getElement(".total-price").innerHTML = item.TotalPrice + " &euro;";
    getElement(".sum-of-articles").textContent = item.SumOfArticles || "";

    tr.append(tdItemCode);
    tr.append(tdItemName);
    tr.append(tdSupplier);
    tr.append(tdPrice);
    tr.append(tdOrders);
    tr.append(tdAverage);
    tr.append(tdInWarehouse);
    tbody.append(tr);
  });

  // NOTE Create Select Dropdown !!!
  suppliers.forEach((supplier) => {
    if (select[5]) select.splice(5, -1);

    const option = document.createElement("option");
    option.setAttribute("value", supplier);
    option.textContent = supplier;

    option.addEventListener("click", (e) => {
      socket.send(JSON.stringify({ supplier: e.target.value }));
    });
    select.append(option);
  });
};

const formatedDate = () => {
  const date = new Date();

  let day = date.getDate();
  if (day < 10) day = `0${day}`;

  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;

  let year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

export { getElement, render, formatedDate };
