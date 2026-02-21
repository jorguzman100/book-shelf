$(document).ready(() => {
  let currentBookId = null;
  const FALLBACK_BOOK_IMAGE = "/images/book-placeholder.svg";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeImageSrc(url) {
    if (typeof url !== "string") {
      return FALLBACK_BOOK_IMAGE;
    }

    var trimmedUrl = url.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      return FALLBACK_BOOK_IMAGE;
    }

    try {
      var parsedUrl = new URL(trimmedUrl);

      if (parsedUrl.protocol === "http:") {
        // Catalog seed data uses http Google Books thumbnails; upgrade to https to satisfy CSP.
        if (/^books\.google\.com$/i.test(parsedUrl.hostname)) {
          parsedUrl.protocol = "https:";
          return parsedUrl.toString();
        }

        return FALLBACK_BOOK_IMAGE;
      }
    } catch (_err) {
      return FALLBACK_BOOK_IMAGE;
    }

    return trimmedUrl;
  }

  function getCurrentUser() {
    return $.get("/api/user_data").then(function(data) {
      if (!data || !data.id) {
        window.location.replace("/login");
        return null;
      }

      return data;
    });
  }

  function renderCategoryBooks(books) {
    $("#booksCards").empty();

    books.forEach((book) => {
      var safeTitle = escapeHtml(book.title);
      var safeAuthors = escapeHtml(book.authors);
      var safeThumbnail = safeImageSrc(book.thumbnail);

      let card = `
        <div class="card" style="width: 12rem;">
          <img src="${safeThumbnail}" class="card-img-top book-cover" alt="${safeTitle} book image" />
          <div class="card-body">
            <h5 class="card-title"><a href="#" class="modalTrigger" bookId="${book.id}">${safeTitle}</a></h5>
            <p class="card-text">By ${safeAuthors}</p>
          </div>
        </div>
      `;

      var $card = $(card);
      $card.find("img.book-cover").on("error", function() {
        this.src = FALLBACK_BOOK_IMAGE;
      });
      $("#booksCards").append($card);
    });
  }

  function renderBookModal(book) {
    var safeThumbnail = safeImageSrc(book.thumbnail);
    var safeTitle = escapeHtml(book.title);
    var safeSubtitle = escapeHtml(book.subtitle);
    var safeAuthors = escapeHtml(book.authors);
    var safeCategories = escapeHtml(book.categories);
    var safePublishedYear = escapeHtml(book.published_year);
    var safeAverageRating = escapeHtml(book.average_rating);
    var safeRatingsCount = escapeHtml(book.ratings_count);
    var safeDescription = escapeHtml(book.description);
    var safePrice = escapeHtml(book.price);

    $(".modal-body").empty();

    let modalBookCard = `
      <div class="card">
        <img src="${safeThumbnail}" class="card-img-top book-cover" alt="${safeTitle}" />
        <div class="card-body">
          <h5 class="card-title"><a href="#" class="modalTrigger" bookId="${book.id}">${safeTitle}</a></h5>
          <p class="card-text"><strong>Subtitle</strong> ${safeSubtitle}</p>
          <p class="card-text"><strong>By</strong> ${safeAuthors}</p>
          <p class="card-text"><strong>Categories</strong> ${safeCategories}</p>
          <p class="card-text"><strong>Published year</strong> ${safePublishedYear}</p>
          <p class="card-text"><strong>Average rating</strong> ${safeAverageRating}</p>
          <p class="card-text"><strong>Ratings count</strong> ${safeRatingsCount}</p>
          <p class="card-text"><strong>Description</strong> ${safeDescription}</p>
          <p class="card-text"><strong>Price</strong> ${safePrice}</p>
        </div>
      </div>
    `;

    var $modalBookCard = $(modalBookCard);
    $modalBookCard.find("img.book-cover").on("error", function() {
      this.src = FALLBACK_BOOK_IMAGE;
    });
    $(".modal-body").append($modalBookCard);
  }

  $(document).on("click", (event) => {
    if ($(event.target).hasClass("categoryLink")) {
      event.preventDefault();

      $.ajax({
        method: "GET",
        url: `/api/books/category/${encodeURIComponent($(event.target).text().trim())}`
      }).then((books) => {
        renderCategoryBooks(books);
      });

      return;
    }

    if ($(event.target).hasClass("modalTrigger")) {
      event.preventDefault();

      $.ajax({
        method: "GET",
        url: `/api/books/${$(event.target).attr("bookId")}`
      }).then((book) => {
        renderBookModal(book);
        $("#bookModal").modal();
        currentBookId = book.id;
      });

      return;
    }

    if ($(event.target).attr("id") === "addToCart") {
      event.preventDefault();
      if (!currentBookId) {
        return;
      }

      getCurrentUser().then((data) => {
        if (!data) {
          return;
        }

        $.post(
          "/api/shoppingcarts",
          {
            UserId: data.id,
            BookId: currentBookId
          },
          () => {
            window.location.href = "/cart";
          }
        );
      });
    }
  });

  $.ajax({
    method: "GET",
    url: "/api/books/"
  }).then((books) => {
    if (!Array.isArray(books) || books.length === 0) {
      $("#categories").append("<li>No books are available yet.</li>");
      $("#booksCards").html(
        '<p class="text-muted">No books found in the catalog. Seed data is required.</p>'
      );
      return;
    }

    let categories = books
      .map((book) => (typeof book.categories === "string" ? book.categories.trim() : ""))
      .filter((category) => category.length > 0);
    let uniqueCategories = Array.from(new Set(categories));

    if (uniqueCategories.length === 0) {
      $("#categories").append("<li>No categories available.</li>");
      return;
    }

    uniqueCategories.forEach((category) => {
      let li = $("<li>");
      let a = $("<a>");
      a.attr("href", "#");
      a.attr("class", "categoryLink");
      a.text(category);
      li.append(a);
      $("#categories").append(li);
    });
  });
});
