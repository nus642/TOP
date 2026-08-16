(function bootstrap() {
  const fileInput = document.querySelector("#import-file");
  const fileNotice = document.querySelector("#file-notice");
  const errorsPanel = document.querySelector("#import-errors");
  const previewPanel = document.querySelector("#import-preview");
  const confirmButton = document.querySelector("#confirm-import");
  const resultPanel = document.querySelector("#import-result");
  const contextForm = document.querySelector("#context-form");

  // Normalized payload awaiting confirmation; null until a clean parse exists.
  let pendingData = null;
  let pendingFileName = "";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  function competitionId() {
    const raw = contextForm.querySelector('[name="competitionId"]').value;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  function tournamentName() {
    return contextForm.querySelector('[name="tournamentName"]').value;
  }

  function resetPanels() {
    pendingData = null;
    errorsPanel.hidden = true;
    errorsPanel.innerHTML = "";
    previewPanel.hidden = true;
    previewPanel.innerHTML = "";
    resultPanel.hidden = true;
    resultPanel.innerHTML = "";
    confirmButton.disabled = true;
  }

  function rowLabel(line) {
    return line ? `第 ${line} 行` : "文件整体";
  }

  function renderErrors(errors, title) {
    errorsPanel.hidden = false;
    errorsPanel.innerHTML = `<h3>${escapeHtml(title)}</h3>
      <ol>${errors.map((entry) =>
        `<li><strong>${escapeHtml(rowLabel(entry.line))}</strong>：${escapeHtml(entry.message)}</li>`).join("")}
      </ol>
      <p class="muted">请修正文件后重新选择上传；导入尚未执行，系统没有写入任何数据。</p>`;
  }

  function renderPreview(data, warnings) {
    const courts = new Set();
    let matchCount = 0;
    for (const round of data.rounds) for (const match of round.matches) {
      courts.add(match.court);
      matchCount += 1;
    }
    const modeLabel = data.mode === "fixed-pair" ? "固定搭档" : "轮转";
    const firstAt = data.rounds[0].matches[0].scheduledAt;

    const roundHtml = data.rounds.map((round) => `<details open><summary>第 ${escapeHtml(round.round)} 轮 · ${round.matches.length} 场</summary>
      <table class="import-table"><thead><tr><th>场地</th><th>时间</th><th>一方</th><th>另一方</th></tr></thead><tbody>
      ${round.matches.map((match) => {
        const side1 = match.team1 || `${match.p1} & ${match.p2}`;
        const side2 = match.team2 || `${match.p3} & ${match.p4}`;
        return `<tr><td>${escapeHtml(match.court)}</td><td>${escapeHtml(new Date(match.scheduledAt).toLocaleString("zh-CN"))}</td><td>${escapeHtml(side1)}</td><td>${escapeHtml(side2)}</td></tr>`;
      }).join("")}
      </tbody></table></details>`).join("");

    previewPanel.hidden = false;
    previewPanel.innerHTML = `<div class="import-stats">
        <span>模式：<strong>${modeLabel}</strong></span>
        <span>选手：<strong>${data.players.length}</strong> 名</span>
        ${data.mode === "fixed-pair" ? `<span>搭档：<strong>${data.pairs.length}</strong> 对</span>` : ""}
        <span>轮次：<strong>${data.rounds.length}</strong> 轮</span>
        <span>比赛：<strong>${matchCount}</strong> 场</span>
        <span>场地：<strong>${courts.size}</strong> 块</span>
        <span>开赛：<strong>${escapeHtml(new Date(firstAt).toLocaleString("zh-CN"))}</strong></span>
      </div>
      ${warnings.length ? `<ul class="import-warnings">${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>` : ""}
      ${roundHtml}`;
  }

  function handleParsed(result, fileName) {
    resetPanels();
    if (result.errors.length > 0) {
      pendingData = null;
      fileNotice.textContent = `已解析「${fileName}」，发现 ${result.errors.length} 处问题，请修正后重试。`;
      fileNotice.className = "notice error";
      renderErrors(result.errors, "文件无法导入");
      return;
    }
    pendingData = result.data;
    pendingFileName = fileName;
    fileNotice.textContent = `已解析「${fileName}」，请核对下方预览。`;
    fileNotice.className = "notice";
    renderPreview(result.data, result.warnings);
    confirmButton.disabled = !competitionId();
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    resetPanels();

    if (!/\.(csv|txt)$/i.test(file.name)) {
      fileNotice.textContent = `「${file.name}」不是 CSV 文件。请在 Excel 中选择「另存为 → CSV UTF-8（逗号分隔）」后再上传。`;
      fileNotice.className = "notice error";
      fileInput.value = "";
      return;
    }
    fileNotice.textContent = `正在解析「${file.name}」…`;
    fileNotice.className = "notice";

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = ImportParser.normalizeCsvToImport(reader.result, { tournamentName: tournamentName() });
        handleParsed(result, file.name);
      } catch (error) {
        fileNotice.textContent = "文件解析失败，请确认文件为 CSV UTF-8 编码。";
        fileNotice.className = "notice error";
      }
    };
    reader.onerror = () => {
      fileNotice.textContent = "无法读取所选文件，请重试。";
      fileNotice.className = "notice error";
    };
    reader.readAsText(file, "utf-8");
  });

  contextForm.addEventListener("submit", (event) => {
    event.preventDefault();
    // Re-parse context only affects the confirm step; a changed competition id
    // requires no re-upload because parsing is competition-independent.
    confirmButton.disabled = !pendingData || !competitionId();
    if (pendingData && tournamentName().trim()) {
      pendingData = { ...pendingData, tournamentName: tournamentName().trim() };
    }
  });

  function renderSummary(summary, competitionIdValue) {
    resultPanel.hidden = false;
    resultPanel.className = "import-result success";
    resultPanel.innerHTML = `<h3>导入成功 ✅</h3>
      <ul>
        <li>选手：${summary.players} 名（全部记为参赛就绪）</li>
        <li>固定搭档：${summary.pairs} 对</li>
        <li>轮次：${summary.rounds} 轮 · 比赛：${summary.matches} 场</li>
      </ul>
      <p class="muted">现在可以前往 <a href="master.html?competitionId=${encodeURIComponent(competitionIdValue)}">主控派单工作台</a> 分配裁判并派单。</p>`;
  }

  function renderFailure(message) {
    resultPanel.hidden = false;
    resultPanel.className = "import-result failure";
    resultPanel.innerHTML = `<h3>导入未执行</h3><p class="notice error">${escapeHtml(message)}</p>
      <p class="muted">整笔事务已回滚，数据库没有任何部分写入。修正问题后可直接重新确认或重新选择文件。</p>`;
  }

  confirmButton.addEventListener("click", async () => {
    if (!pendingData) return;
    const id = competitionId();
    if (!id) {
      fileNotice.textContent = "请先填写有效的比赛编号。";
      fileNotice.className = "notice error";
      return;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = "正在导入…";
    resultPanel.hidden = true;

    try {
      const response = await fetch(`/api/competition/${encodeURIComponent(id)}/schedule/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ImportParser.stripClientMeta(pendingData))
      });
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success) {
        renderSummary(body.summary, id);
        fileNotice.textContent = `「${pendingFileName}」已导入比赛 ${id}。`;
        fileNotice.className = "notice";
        return;
      }

      if (response.status === 400 && body.details && Array.isArray(body.details.errors)) {
        const mapped = ImportParser.mapServerErrorRows(pendingData, body.details.errors);
        renderErrors(mapped, "服务端校验未通过，导入已取消");
        renderFailure(body.error || "文件内容未通过赛事系统校验。");
        return;
      }
      if (response.status === 401) { renderFailure("登录会话已失效，请重新登录后再导入。"); return; }
      if (response.status === 403) { renderFailure("只有主控（Master）身份可以导入赛程。"); return; }
      if (response.status === 404) { renderFailure(`比赛 ${id} 不存在，请核对比赛编号。`); return; }
      if (response.status === 409) { renderFailure(body.error || "该比赛已开始执行，不允许再导入。"); return; }
      renderFailure(body.error || "导入失败，请稍后重试；如反复失败请联系技术支持。");
    } catch (error) {
      renderFailure("网络异常，导入请求没有送达。系统未写入任何数据，请检查网络后重试。");
    } finally {
      confirmButton.disabled = !pendingData;
      confirmButton.textContent = "确认无误，导入赛程";
    }
  });
})();
