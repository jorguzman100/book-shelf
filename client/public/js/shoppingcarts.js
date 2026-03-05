$(document).ready(() => {
  let cleanedCarts = [];

  function getCurrentUser() {
    return $.get("/api/user_data").then(function(data) {
      if (!data || !data.id) {
        window.location.replace("/login");
        return null;
      }

      return data;
    });
  }

  $(document).on("click", (event) => {
    if ($(event.target).attr("id") === "continueBrowsing") {
      window.location.href = "/browse";
      return;
    }

    if ($(event.target).attr("id") === "purchasesHistory") {
      $("#purchasesDiv").toggle();
      return;
    }

    if ($(event.target).attr("id") !== "confirmPurchase") {
      return;
    }

    getCurrentUser().then(function(data) {
      if (!data) {
        return;
      }

      cleanedCarts.forEach((cart) => {
        Object.values(cart).forEach((cartElement) => {
          if (
            typeof cartElement === "object" &&
            cartElement !== null &&
            cartElement[0] !== undefined
          ) {
            $.post("/api/purchases", {
              UserId: data.id,
              BookId: cartElement[0].id
            });
          }
        });
      });

      $.ajax({
        method: "DELETE",
        url: `/api/shoppingcarts/${data.id}`
      }).always(() => {
        $("#purchaeConfirmationModal").modal();

        $("#purchaeConfirmationModal").on("hidden.bs.modal", function() {
          loadShoppingcart();
          loadPurchases();
          $("#purchasesDiv").show();
          $("#confirmPurchase").hide();
        });
      });
    });
  });

  const loadShoppingcart = () => {
    $("#cartTableBody").empty();

    $.ajax({
      method: "GET",
      url: "/api/shoppingcarts/"
    }).then((shoppingcarts) => {
      let total = 0;

      if (shoppingcarts.length > 0) {
        cleanedCarts = shoppingcarts.map((shoppingcart) => {
          return {
            id: shoppingcart.id,
            UserId: shoppingcart.UserId,
            Books: shoppingcart.Books
          };
        });

        cleanedCarts.forEach((cart) => {
          let tr = $("<tr>");
          let td0 = $("<td>");
          let td1 = $("<td>");
          let td2 = $("<td>");
          let td3 = $("<td>");
          let td4 = $("<td>");
          td0.text(cart.id);
          td1.text(cart.UserId);

          Object.values(cart).forEach((cartElement) => {
            if (
              typeof cartElement === "object" &&
              cartElement !== null &&
              cartElement[0] !== undefined
            ) {
              td2.text(cartElement[0].id);
              td3.text(cartElement[0].title);
              td4.text(cartElement[0].price);
              total += parseFloat(cartElement[0].price) || 0;
            }
            tr.append(td0);
            tr.append(td1);
            tr.append(td2);
            tr.append(td3);
            tr.append(td4);
          });
          $("#cartTableBody").append(tr);
        });

        total = total.toFixed(2);
        let tr = $("<tr>");
        let td0 = $("<td>");
        let td1 = $("<td>");
        let td2 = $("<td>");
        let td3 = $("<td>");
        let td4 = $("<td>");
        td3.text("Total");
        td4.text(`${total}`);
        tr.append(td0);
        tr.append(td1);
        tr.append(td2);
        tr.append(td3);
        tr.append(td4);
        $("#cartTableBody").append(tr);
      } else {
        $("#confirmPurchase").hide();
      }
    });
  };

  const loadPurchases = () => {
    $("#purchasesTableBody").empty();

    getCurrentUser().then(function(data) {
      if (!data) {
        return;
      }

      $.ajax({
        method: "GET",
        url: `/api/purchase/${data.id}`
      }).then((purchases) => {
        let cleanedPurchases = purchases.map((purchase) => {
          return {
            id: purchase.id,
            date: moment(purchase.date).format("MMM Do YY"),
            UserId: purchase.UserId,
            Books: purchase.Books
          };
        });

        cleanedPurchases.forEach((purchase) => {
          let tr = $("<tr>");
          let td0 = $("<td>");
          let td1 = $("<td>");
          let td2 = $("<td>");
          let td3 = $("<td>");
          let td4 = $("<td>");
          let td5 = $("<td>");
          td0.text(purchase.id);
          td1.text(purchase.UserId);
          td5.text(purchase.date);
          Object.values(purchase).forEach((purchaseElement) => {
            if (
              typeof purchaseElement === "object" &&
              purchaseElement !== null &&
              purchaseElement[0] !== undefined
            ) {
              td2.text(purchaseElement[0].id);
              td3.text(purchaseElement[0].title);
              td4.text(purchaseElement[0].price);
            }
          });
          tr.append(td0);
          tr.append(td1);
          tr.append(td2);
          tr.append(td3);
          tr.append(td4);
          tr.append(td5);
          $("#purchasesTableBody").append(tr);
        });
      });
    });
  };

  const init = () => {
    getCurrentUser().then(function(data) {
      if (!data) {
        return;
      }

      loadShoppingcart();
      loadPurchases();
      $("#purchasesDiv").hide();
    });
  };

  init();
});
