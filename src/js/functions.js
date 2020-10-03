// NOTE Functions !!
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
    tdAverage.textContent = "/";

    const tdInWarehouse = document.createElement("td");
    tdInWarehouse.textContent = item.onHand || "/";

    getElement(".total-price").innerHTML = item.TotalPrice + " &euro;";
    getElement(".sum-of-articles").textContent = item.SumOfArticles || "";
    if (item.AvgArticleByOrder) {
      getElement(".average-articles").textContent =
        item.AvgArticleByOrder.toFixed(2) || "";
    }

    tr.append(tdItemCode);
    tr.append(tdItemName);
    tr.append(tdSupplier);
    tr.append(tdPrice);
    tr.append(tdOrders);
    tr.append(tdAverage);
    tr.append(tdInWarehouse);
    tbody.append(tr);
  });

  // NOTE Create Select Supplier Dropdown !!!
  suppliers.forEach((supplier) => {
    const option = document.createElement("option");
    option.setAttribute("value", supplier);
    option.className = "suppliers";
    option.textContent = supplier;

    if (!select[5]) {
      select.append(option);
    }
  });
  //   getElement(".all-suppliers").addEventListener("click", () => {
  //     socket.send(JSON.stringify({ supplier: "all" }));
  //   });
};

const formatedDate = () => {
  const date = new Date();

  let day = date.getDate();
  if (day < 10) day = `0${day}`;

  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;

  let year = date.getFullYear();

  return `${year}-${month}-${day}`;
};

const compareDate = (a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);

  if (dateB < dateA) return false;
  return true;
};

const prependZero = (value) => {
  return value
    .split(".")
    .map((el) => {
      if (el < 10) {
        return (el = "0" + el);
      } else {
        return el;
      }
    })
    .reverse()
    .join("-");
};