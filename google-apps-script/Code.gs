const CONFIG = {
  APP_NAME: 'IP_RJP Agenda',
  ROOT_FOLDER_NAME: 'IP_RJP_Agenda',
  SHEET_NAME: 'IP_RJP_Agenda_Dados'
};

function doGet() {
  return jsonOutput({ ok: true, app: CONFIG.APP_NAME, message: 'Servidor IP_RJP ativo' });
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || '';
    const payload = body.payload || {};

    if (action === 'test') return jsonOutput({ ok: true, message: 'Ligação Apps Script ativa' });
    if (action === 'saveActivity') return jsonOutput(saveActivity(payload));
    if (action === 'syncRecords') return jsonOutput(syncRecords(payload.records || []));
    if (action === 'getRecords') return jsonOutput(getRecords());
    if (action === 'createCalendarEvent') return jsonOutput(createCalendarEvent(payload));
    if (action === 'getCalendarEvents') return jsonOutput(getCalendarEvents(payload));
    if (action === 'createTask') return jsonOutput(createTask(payload));
    if (action === 'getTasks') return jsonOutput(getTasks());
    if (action === 'getContacts') return jsonOutput(getContacts());

    return jsonOutput({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function saveActivity(item) {
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Atividades');
  if (sh.getLastRow() === 0) sh.appendRow(['Data', 'Início', 'Fim', 'Tipo', 'Título', 'Local', 'Observações', 'Criado em']);
  sh.appendRow([item.date || item.data || '', item.start || item.inicio || '', item.end || item.fim || '', item.type || item.tipo || '', item.title || item.servico || '', item.location || item.local || item.destino || '', item.notes || item.observacoes || '', new Date()]);
  return { ok: true, message: 'Atividade guardada no Google Sheets' };
}

function syncRecords(records) {
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Registos');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['ID', 'Tipo', 'Data', 'Técnico', 'Serviço', 'Matrícula', 'Viatura', 'Origem', 'Destino', 'Local', 'Início', 'Fim', 'Km Inicial', 'Km Final', 'Turno', 'Contacto', 'Ocorrência', 'Estado', 'Observações', 'Criado em']);
  }
  records.forEach(function(r) {
    sh.appendRow([r.id || '', r.tipo || '', r.data || '', r.tecnico || '', r.servico || '', r.matricula || '', r.viatura || '', r.origem || '', r.destino || '', r.local || '', r.inicio || '', r.fim || '', r.kmInicial || '', r.kmFinal || '', r.turno || '', r.contacto || '', r.ocorrencia || '', r.estado || '', r.observacoes || '', new Date()]);
  });
  return { ok: true, saved: records.length };
}

function getRecords() {
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Registos');
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return { ok: true, records: [] };
  const headers = values.shift();
  const records = values.map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
  return { ok: true, records: records };
}

function createCalendarEvent(activity) {
  const date = activity.date || activity.data || Utilities.formatDate(new Date(), 'Europe/Lisbon', 'yyyy-MM-dd');
  const start = activity.start || activity.inicio || '09:00';
  const end = activity.end || activity.fim || '10:00';
  const title = activity.title || activity.type || activity.tipo || 'Atividade IP_RJP';
  const location = activity.location || activity.local || activity.destino || '';
  const notes = activity.notes || activity.observacoes || 'Criado pela IP_RJP';

  const startDate = new Date(date + 'T' + start + ':00');
  const endDate = new Date(date + 'T' + end + ':00');
  const event = CalendarApp.getDefaultCalendar().createEvent(title, startDate, endDate, {
    location: location,
    description: notes
  });

  saveActivity({ date: date, start: start, end: end, type: 'Calendar', title: title, location: location, notes: notes });

  return { ok: true, id: event.getId(), htmlLink: '', summary: title };
}

function getCalendarEvents(payload) {
  const start = payload.start ? new Date(payload.start) : new Date();
  const end = payload.end ? new Date(payload.end) : new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
  const events = CalendarApp.getDefaultCalendar().getEvents(start, end).slice(0, 50).map(function(ev) {
    return {
      id: ev.getId(),
      summary: ev.getTitle(),
      location: ev.getLocation(),
      description: ev.getDescription(),
      start: { dateTime: ev.getStartTime().toISOString() },
      end: { dateTime: ev.getEndTime().toISOString() }
    };
  });
  return { ok: true, items: events };
}

function createTask(payload) {
  const title = payload.title || 'Tarefa IP_RJP';
  const dueDate = payload.dueDate || '';
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Tarefas');
  if (sh.getLastRow() === 0) sh.appendRow(['Título', 'Data limite', 'Estado', 'Criado em']);
  sh.appendRow([title, dueDate, 'Por fazer', new Date()]);
  return { ok: true, title: title, dueDate: dueDate };
}

function getTasks() {
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Tarefas');
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return { ok: true, items: [] };
  const rows = values.slice(1).map(function(r, index) {
    return { id: String(index + 1), title: r[0], due: r[1], status: r[2] || 'needsAction' };
  });
  return { ok: true, items: rows };
}

function getContacts() {
  try {
    const contacts = ContactsApp.getContacts().slice(0, 100).map(function(c) {
      const emails = c.getEmails().map(function(e) { return { value: e.getAddress() }; });
      const phones = c.getPhones().map(function(p) { return { value: p.getPhoneNumber() }; });
      return { names: [{ displayName: c.getFullName() }], emailAddresses: emails, phoneNumbers: phones };
    });
    return { ok: true, connections: contacts };
  } catch (err) {
    return { ok: true, connections: [], warning: 'Contactos indisponíveis: ' + err };
  }
}

function getSheet() {
  const files = DriveApp.getFilesByName(CONFIG.SHEET_NAME);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create(CONFIG.SHEET_NAME);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
