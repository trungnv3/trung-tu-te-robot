(() => {
  const form = document.querySelector("#error-lookup-form");

  if (!form) {
    return;
  }

  const manufacturerSelect = document.querySelector("#lookup-manufacturer");
  const modelSelect = document.querySelector("#lookup-model");
  const queryInput = document.querySelector("#lookup-query");
  const resetButton = document.querySelector("#lookup-reset");
  const status = document.querySelector("#lookup-status");
  const resultsTitle = document.querySelector("#lookup-results-title");
  const empty = document.querySelector("#lookup-empty");
  const results = document.querySelector("#lookup-results");

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = text;
    }

    return element;
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function setEmpty(icon, title, message) {
    empty.replaceChildren(
      createElement("span", "", icon),
      createElement("h3", "", title),
      createElement("p", "", message)
    );
    empty.hidden = false;
    results.hidden = true;
    results.replaceChildren();
  }

  function setOptions(select, placeholder, values, selectedValue = "") {
    const fragment = document.createDocumentFragment();
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    fragment.appendChild(placeholderOption);

    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === selectedValue;
      fragment.appendChild(option);
    });

    select.replaceChildren(fragment);
  }

  async function fetchJson(path) {
    const response = await fetch(path, {
      headers: {
        Accept: "application/json"
      }
    });

    let body;

    try {
      body = await response.json();
    } catch (error) {
      body = null;
    }

    if (!response.ok || !body?.ok) {
      throw new Error(
        body?.error || "Không thể tải dữ liệu tra cứu."
      );
    }

    return body;
  }

  async function loadModels(selectedValue = "") {
    const manufacturer = manufacturerSelect.value;

    if (!manufacturer) {
      setOptions(modelSelect, "Chọn hãng trước", []);
      modelSelect.disabled = true;
      return;
    }

    modelSelect.disabled = true;
    setOptions(modelSelect, "Đang tải model...", []);

    try {
      const params = new URLSearchParams({ manufacturer });
      const data = await fetchJson(`/api/error-lookup/filters?${params}`);

      setOptions(
        modelSelect,
        "Tất cả model/phạm vi",
        data.model_scopes || [],
        selectedValue
      );
      modelSelect.disabled = false;
    } catch (error) {
      setOptions(modelSelect, "Không tải được model", []);
      modelSelect.disabled = true;
      setStatus(error.message, true);
    }
  }

  function isOfficial(record) {
    return String(record.publication_status || "").startsWith("official-");
  }

  function makeBadge(className, text) {
    return createElement("span", className, text);
  }

  function makeResultCard(record) {
    const card = createElement("article", "lookup-card");
    const top = createElement("div", "lookup-card-top");
    const meta = createElement("div", "lookup-meta");
    const tags = createElement("div", "lookup-tags");
    const official = isOfficial(record);
    const typeLabel = record.record_type === "error_code"
      ? "Mã lỗi"
      : official
        ? "Triệu chứng chính hãng"
        : "Triệu chứng tham khảo";

    if (record.display_code) {
      meta.appendChild(makeBadge("lookup-code", `Mã ${record.display_code}`));
    }

    meta.appendChild(
      makeBadge(
        `lookup-type ${official || record.record_type === "error_code" ? "official" : "reference"}`,
        typeLabel
      )
    );

    const hasConfidenceScore = record.confidence_score !== null &&
        record.confidence_score !== undefined &&
        record.confidence_score !== "";

    if (record.confidence_label || hasConfidenceScore) {
      const confidenceText = hasConfidenceScore
        ? `Độ tin cậy: ${record.confidence_label || "chưa đánh giá"} (${Number(record.confidence_score).toFixed(2)})`
        : `Độ tin cậy: ${record.confidence_label}`;

      tags.appendChild(
        makeBadge("lookup-confidence", confidenceText)
      );
    }

    top.append(meta, tags);

    const title = createElement("h3", "", record.title_vi);
    const model = createElement(
      "p",
      "lookup-model",
      `${record.manufacturer} · ${record.model_scope}`
    );
    const description = createElement(
      "p",
      "lookup-description",
      record.description_vi
    );
    const nextStep = createElement("p", "lookup-next-step");
    nextStep.append(
      createElement("strong", "", "Bước đầu tiên: "),
      document.createTextNode(record.first_action_vi)
    );

    card.append(top, title, model, description, nextStep);

    if (record.safety_stop_vi) {
      const safety = createElement("p", "lookup-safety");
      safety.append(
        createElement("strong", "", "Dừng và kiểm tra kỹ hơn: "),
        document.createTextNode(record.safety_stop_vi)
      );
      card.appendChild(safety);
    }

    if (record.source_name || record.source_url || record.source_accessed_at) {
      const source = createElement("div", "lookup-source");

      if (record.source_name) {
        source.appendChild(
          createElement("span", "", `Nguồn: ${record.source_name}`)
        );
      }

      if (record.source_url) {
        const sourceLink = document.createElement("a");
        sourceLink.href = record.source_url;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = record.source_name ? "Mở nguồn" : "Nguồn tham khảo";
        source.appendChild(sourceLink);
      }

      if (record.source_accessed_at) {
        source.appendChild(
          createElement("span", "", `Đối chiếu: ${record.source_accessed_at}`)
        );
      }

      card.appendChild(source);
    }

    if (record.model_scope_note_vi) {
      card.appendChild(
        createElement(
          "p",
          "lookup-source-note",
          record.model_scope_note_vi
        )
      );
    }

    return card;
  }

  function renderResults(data) {
    const records = Array.isArray(data.results) ? data.results : [];

    if (records.length === 0) {
      resultsTitle.textContent = "Không tìm thấy kết quả phù hợp";
      setEmpty(
        "–",
        "Chưa có mục khớp với tra cứu này",
        "Hãy thử đổi model, nhập mã khác hoặc tìm bằng một triệu chứng ngắn hơn."
      );
      setStatus("Không tìm thấy kết quả phù hợp.");
      return;
    }

    resultsTitle.textContent = `${records.length} kết quả tra cứu`;
    const fragment = document.createDocumentFragment();

    records.forEach((record) => {
      fragment.appendChild(makeResultCard(record));
    });

    results.replaceChildren(fragment);
    results.hidden = false;
    empty.hidden = true;
    setStatus(`Đã tìm thấy ${records.length} kết quả. Hãy đối chiếu đúng model trước khi thao tác.`);
  }

  async function runLookup() {
    const manufacturer = manufacturerSelect.value;
    const modelScope = modelSelect.value;
    const query = queryInput.value.trim();

    if (!manufacturer && !modelScope && !query) {
      resultsTitle.textContent = "Chưa có truy vấn";
      setEmpty(
        "⌕",
        "Chọn robot hoặc nhập mã lỗi",
        "Ví dụ chọn Roborock → S4 → nhập “10”, hoặc nhập “không sạc”."
      );
      setStatus("Chọn ít nhất một điều kiện để tra cứu.");
      return;
    }

    const params = new URLSearchParams({ limit: "50" });

    if (manufacturer) {
      params.set("manufacturer", manufacturer);
    }

    if (modelScope) {
      params.set("model_scope", modelScope);
    }

    if (query) {
      params.set("q", query);
    }

    setStatus("Đang tra cứu dữ liệu...");

    try {
      const data = await fetchJson(`/api/error-lookup?${params}`);
      renderResults(data);
    } catch (error) {
      resultsTitle.textContent = "Không thể tải kết quả";
      setEmpty(
        "!",
        "Tra cứu tạm thời chưa khả dụng",
        "Vui lòng thử lại sau ít phút hoặc liên hệ Trung Tử Tế để được hỗ trợ."
      );
      setStatus(error.message, true);
    }
  }

  async function initialise() {
    try {
      const data = await fetchJson("/api/error-lookup/filters");
      setOptions(
        manufacturerSelect,
        "Tất cả hãng",
        data.manufacturers || []
      );
      setStatus("Sẵn sàng tra cứu. Hãy chọn hãng/model hoặc nhập mã lỗi.");
    } catch (error) {
      setStatus(error.message, true);
      setEmpty(
        "!",
        "Dữ liệu đang được cập nhật",
        "Vui lòng thử lại sau ít phút hoặc liên hệ để được hỗ trợ kỹ thuật."
      );
    }
  }

  manufacturerSelect.addEventListener("change", async () => {
    await loadModels();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runLookup();
  });

  resetButton.addEventListener("click", async () => {
    manufacturerSelect.value = "";
    queryInput.value = "";
    await loadModels();
    resultsTitle.textContent = "Chưa có truy vấn";
    setEmpty(
      "⌕",
      "Chọn robot hoặc nhập mã lỗi",
      "Ví dụ chọn Roborock → S4 → nhập “10”, hoặc nhập “không sạc”."
    );
    setStatus("Đã xóa bộ lọc.");
  });

  initialise();
})();
