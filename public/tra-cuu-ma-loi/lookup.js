(() => {
  const form = document.querySelector("#error-lookup-form");

  if (!form) return;

  const deviceTypeSelect = document.querySelector("#lookup-device-type");
  const manufacturerSelect = document.querySelector("#lookup-manufacturer");
  const modelSelect = document.querySelector("#lookup-model");
  const symptomSelect = document.querySelector("#lookup-symptom");
  const queryInput = document.querySelector("#lookup-query");
  const resetButton = document.querySelector("#lookup-reset");
  const status = document.querySelector("#lookup-status");
  const resultsTitle = document.querySelector("#lookup-results-title");
  const empty = document.querySelector("#lookup-empty");
  const results = document.querySelector("#lookup-results");

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
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

    values.forEach((item) => {
      const value = typeof item === "string" ? item : String(item?.value || "");
      const label = typeof item === "string" ? item : String(item?.label || value);
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === selectedValue;
      fragment.appendChild(option);
    });

    select.replaceChildren(fragment);
  }

  async function fetchJson(path) {
    const response = await fetch(path, { headers: { Accept: "application/json" } });
    let body = null;

    try {
      body = await response.json();
    } catch (_) {
      body = null;
    }

    if (!response.ok || !body?.ok) {
      throw new Error(body?.error || "Không thể tải dữ liệu tra cứu.");
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
      if (deviceTypeSelect.value) params.set("device_type", deviceTypeSelect.value);
      const data = await fetchJson(`/api/error-lookup/filters?${params}`);
      setOptions(modelSelect, "Tất cả model", data.model_scopes || [], selectedValue);
      modelSelect.disabled = false;
    } catch (error) {
      setOptions(modelSelect, "Không tải được model", []);
      modelSelect.disabled = true;
      setStatus(error.message, true);
    }
  }

  async function loadSymptoms(selectedValue = "") {
    const manufacturer = manufacturerSelect.value;

    if (!manufacturer) {
      setOptions(symptomSelect, "Chọn hãng trước", []);
      symptomSelect.disabled = true;
      return;
    }

    symptomSelect.disabled = true;
    setOptions(symptomSelect, "Đang tải triệu chứng...", []);

    try {
      const params = new URLSearchParams({ manufacturer });
      if (deviceTypeSelect.value) params.set("device_type", deviceTypeSelect.value);
      if (modelSelect.value) params.set("model_scope", modelSelect.value);
      const data = await fetchJson(`/api/error-lookup/filters?${params}`);
      setOptions(symptomSelect, "Tất cả triệu chứng", data.symptoms || [], selectedValue);
      symptomSelect.disabled = false;
    } catch (error) {
      setOptions(symptomSelect, "Không tải được triệu chứng", []);
      symptomSelect.disabled = true;
      setStatus(error.message, true);
    }
  }

  async function loadManufacturers(selectedValue = "") {
    manufacturerSelect.disabled = true;
    setOptions(manufacturerSelect, "Đang tải hãng...", []);

    try {
      const params = new URLSearchParams();
      if (deviceTypeSelect.value) params.set("device_type", deviceTypeSelect.value);
      const data = await fetchJson(`/api/error-lookup/filters?${params}`);
      setOptions(manufacturerSelect, "Tất cả hãng", data.manufacturers || [], selectedValue);
      manufacturerSelect.disabled = false;
    } catch (error) {
      setOptions(manufacturerSelect, "Không tải được hãng", []);
      setStatus(error.message, true);
    }
  }

  function isOfficial(record) {
    return String(record.publication_status || "").startsWith("official-");
  }

  function makeBadge(className, text) {
    return createElement("span", className, text);
  }

  function parseSteps(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((step) => step.replace(/^\s*\d+[.)\-:]\s*/, "").trim())
      .filter(Boolean);
  }

  function makeChecklist(steps) {
    if (!steps.length) return null;

    const section = createElement("section", "lookup-checklist");
    const list = document.createElement("ol");
    steps.forEach((step) => list.appendChild(createElement("li", "", step)));
    section.append(createElement("h4", "", "Tự kiểm tra tại nhà"), list);
    return section;
  }

  function makeServiceGuide(message) {
    if (!message) return null;

    const section = createElement("section", "lookup-service-guide");
    section.append(
      createElement("h4", "", "Khi nào nên dừng và mang máy đi kiểm tra"),
      createElement("p", "", message)
    );
    return section;
  }

  function makeResultCard(record) {
    const card = createElement("article", "lookup-card");
    const top = createElement("div", "lookup-card-top");
    const meta = createElement("div", "lookup-meta");
    const official = isOfficial(record);
    const typeLabel = record.record_type === "error_code"
      ? "Mã lỗi theo model"
      : official ? "Triệu chứng chính hãng" : "Hướng dẫn tự kiểm tra";

    if (record.display_code) {
      meta.appendChild(makeBadge("lookup-code", `Mã ${record.display_code}`));
    }

    meta.appendChild(
      makeBadge(
        `lookup-type ${official || record.record_type === "error_code" ? "official" : "reference"}`,
        typeLabel
      )
    );
    top.append(meta);

    const title = createElement("h3", "", record.title_vi);
    const model = createElement("p", "lookup-model", `${record.manufacturer} · ${record.model_scope}`);
    const description = createElement("p", "lookup-description", record.description_vi);
    const nextStep = createElement("p", "lookup-next-step");
    nextStep.append(
      createElement("strong", "", "Bắt đầu từ đây: "),
      document.createTextNode(record.first_action_vi)
    );

    card.append(top, title, model, description, nextStep);

    const checklist = makeChecklist(parseSteps(record.diagnostic_steps_vi));
    if (checklist) card.appendChild(checklist);

    const serviceGuide = makeServiceGuide(
      record.service_handoff_vi || record.safety_stop_vi
    );
    if (serviceGuide) card.appendChild(serviceGuide);

    return card;
  }

  function renderResults(data) {
    const records = Array.isArray(data.results) ? data.results : [];

    if (!records.length) {
      resultsTitle.textContent = "Không tìm thấy kết quả phù hợp";
      setEmpty(
        "–",
        "Chưa có mục khớp với tra cứu này",
        "Hãy thử đổi model, chọn một triệu chứng khác hoặc nhập mã lỗi hiển thị trên máy."
      );
      setStatus("Không tìm thấy kết quả phù hợp.");
      return;
    }

    resultsTitle.textContent = `${records.length} kết quả tra cứu`;
    const fragment = document.createDocumentFragment();
    records.forEach((record) => fragment.appendChild(makeResultCard(record)));
    results.replaceChildren(fragment);
    results.hidden = false;
    empty.hidden = true;
    setStatus(`Đã tìm thấy ${records.length} kết quả. Chỉ thực hiện các bước an toàn, dễ tiếp cận.`);
  }

  async function runLookup() {
    const deviceType = deviceTypeSelect.value;
    const manufacturer = manufacturerSelect.value;
    const modelScope = modelSelect.value;
    const selectedSymptom = symptomSelect.value;
    const selectedCode = selectedSymptom.startsWith("code:")
      ? selectedSymptom.slice("code:".length)
      : "";
    const query = queryInput.value.trim() || (
      selectedCode ? "" : selectedSymptom.replace(/^symptom:/, "")
    );

    if (!deviceType && !manufacturer && !modelScope && !query) {
      resultsTitle.textContent = "Chưa có truy vấn";
      setEmpty(
        "⌕",
        "Chọn robot hoặc triệu chứng",
        "Ví dụ chọn Dreame → L10s Ultra → “Không sạc, không về trạm”."
      );
      setStatus("Chọn ít nhất một điều kiện để tra cứu.");
      return;
    }

    const params = new URLSearchParams({ limit: "50" });
    if (deviceType) params.set("device_type", deviceType);
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (modelScope) params.set("model_scope", modelScope);
    if (query) params.set("q", query);
    if (!query && selectedCode) params.set("error_code", selectedCode);

    setStatus("Đang tra cứu dữ liệu...");

    try {
      renderResults(await fetchJson(`/api/error-lookup?${params}`));
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
      await loadManufacturers();
      setStatus("Sẵn sàng tra cứu. Hãy chọn loại máy, hãng, model hoặc triệu chứng.");
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
    await loadSymptoms();
  });

  deviceTypeSelect.addEventListener("change", async () => {
    manufacturerSelect.value = "";
    modelSelect.value = "";
    symptomSelect.value = "";
    await loadManufacturers();
    await loadModels();
    await loadSymptoms();
  });

  modelSelect.addEventListener("change", async () => {
    await loadSymptoms();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runLookup();
  });

  resetButton.addEventListener("click", async () => {
    deviceTypeSelect.value = "";
    manufacturerSelect.value = "";
    queryInput.value = "";
    await loadManufacturers();
    await loadModels();
    await loadSymptoms();
    resultsTitle.textContent = "Chưa có truy vấn";
    setEmpty(
      "⌕",
      "Chọn robot hoặc triệu chứng",
      "Ví dụ chọn Dreame → L10s Ultra → “Không sạc, không về trạm”."
    );
    setStatus("Đã xóa bộ lọc.");
  });

  initialise();
})();
