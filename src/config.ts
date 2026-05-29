export type Language = 'en' | 'pt';

export const CONFIG = {
  services: [
    { id: "regular_cut", pt: "Corte Normal", en: "Regular Cut", price: 50, duration: 45, category: "Cut", includes: "" },
    { id: "beard", pt: "Barba", en: "Beard", price: 25, duration: 20, category: "Beard", includes: "" },
    { id: "hair_beard", pt: "Cabelo e Barba", en: "Hair & Beard", price: 55, duration: 55, category: "Combo", includes: "" },
    { id: "eyebrow", pt: "Sobrancelha", en: "Eyebrow", price: 15, duration: 10, category: "Detail", includes: "" },
    { id: "neckline_beard", pt: "Pezinho + Barba", en: "Neckline + Beard", price: 30, duration: 25, category: "Detail", includes: "" },
    { id: "classic_scissor", pt: "Corte Clássico / Só Tesoura", en: "Classic Scissor Cut", price: 40, duration: 40, category: "Cut", includes: "Scissor-only classic finish" },
    { id: "premium_combo", pt: "Combo Premium", en: "Premium Combo", price: 75, duration: 60, category: "Combo", includes: "Regular cut, beard, eyebrow, hot towel" },
    { id: "classic_combo", pt: "Combo Classic", en: "Classic Combo", price: 70, duration: 55, category: "Combo", includes: "Classic cut, beard, eyebrow, hot towel" },
    { id: "hair_pigmentation", pt: "Pigmentação Cabelo", en: "Hair Pigmentation", price: 30, duration: 35, category: "Color", includes: "" },
    { id: "beard_pigmentation", pt: "Pigmentação Barba", en: "Beard Pigmentation", price: 30, duration: 30, category: "Color", includes: "" },
    { id: "hot_towel", pt: "Toalha Quente", en: "Hot Towel", price: 20, duration: 15, category: "Extra", includes: "" }
  ]
};

export const copy = {
  en: {
    "nav.about": "About", "nav.services": "Services", "nav.booking": "Booking", "nav.location": "Location",
    "cta.book": "Book Now", "cta.bookFull": "Start Booking", "cta.services": "View Services",
    "hero.kicker": "Custom barber booking · Framingham, MA",
    "hero.title": "Choose the cut.<br><span>Hugo handles the chair.</span>",
    "hero.lead": "A premium booking experience for Hugo Barber. Choose your service, select a date and time, and book your appointment directly in Hugo's calendar.",
    "badge.google": "<strong>Direct Google Sync</strong> · added to calendar", "badge.pay": "<strong>Pay in person</strong> · no online checkout", "badge.only": "<strong>Hugo only</strong> · personal classic attention",
    "card.kicker": "Booking engine", "card.title": "Schedule Directly", "card.divider": "custom flow", "card.notice": "Select a time below or click Start Booking. Your slot is added to Hugo's Google Calendar directly.",
    "preview.step1": "Step 1", "preview.service": "Choose service", "preview.step2": "Step 2", "preview.details": "Select date/time & details", "preview.step3": "Step 3", "preview.google": "Direct scheduling",
    "about.kicker": "Since 2011", "about.title": "A sharper booking experience for a sharper cut.", "about.body": "Hugo works directly with each client from Goat Barbershop in Framingham. This software checks Hugo's calendar busy periods and records your booking directly, without redirects or middlemen.",
    "services.kicker": "Services", "services.title": "Available in the booking flow", "services.body": "The public page shows the service menu. Prices and durations appear inside the custom booking experience.",
    "flow.kicker": "How it works", "flow.title": "Check availability, book your appointment.", "flow.one": "Select your barbery service and any optional add-ons.", "flow.two": "Pick an available date and a 15-minute slot direct from Hugo's Google Calendar.", "flow.three": "Confirm your appointment! The program books his calendar directly and shows a receipt.",
    "location.kicker": "Location", "location.map": "Open in Google Maps", "hours.title": "Hours", "hours.week": "Monday to Saturday", "hours.sunday": "Sunday", "hours.closed": "Closed", "hours.note": "You can request appointment slots starting up to 6:00 PM. High demand slots book fast.",
    "modal.kicker": "Book an Appointment", "modal.title": "Schedule appointment", "modal.subtitle": "Choose your service first, then choose a day/time, then fill your details and confirm.", "modal.services": "1. Choose service",
    "addon.title": "Add wash & dry", "addon.body": "Optional preference. Adds 10 minutes to the appointment.",
    "addon.hotTowel.title": "Hot towel", "addon.hotTowel.body": "Relaxing hot towel treatment. Adds 15 minutes.",
    "field.name": "Your Name *", "field.phone": "Phone Number *", "field.email": "Email Address (optional)", "field.language": "Preferred language", "field.notes": "Notes / Preferences for Hugo",
    "summary.kicker": "Details", "summary.title": "Booking Details", "summary.service": "Service", "summary.addon": "Add-on", "summary.duration": "Total duration", "summary.price": "Estimated price", "summary.notice": "By clicking 'Confirm', your appointment is inserted into Hugo's real calendar. Cancel or modify by contacting him directly.",
    "google.button": "Confirm Appointment", "none": "None", "wash": "Wash & dry", "hotTowel": "Hot towel", "optional": "optional", "mins": "min", "selectService": "Please choose a service first.",
    "field.date": "2. Choose Date", "field.time": "4. Select Time Slot", "field.detailsHeader": "3. Client Details",
    "msg.booking": "Booking your spot...",
    "msg.success": "Your appointment has been added to Hugo’s calendar. Payment is made in person.",
    "msg.failure": "We couldn’t add this appointment to Hugo’s calendar. Please contact Hugo directly."
  },
  pt: {
    "nav.about": "Sobre", "nav.services": "Serviços", "nav.booking": "Agendamento", "nav.location": "Localização",
    "cta.book": "Agendar Agora", "cta.bookFull": "Começar Agendamento", "cta.services": "Ver Serviços",
    "hero.kicker": "Agendamento customizado · Framingham, MA",
    "hero.title": "Escolha o corte.<br><span>Hugo cuida da cadeira.</span>",
    "hero.lead": "Uma experiência de agendamento premium para Hugo Barber. Escolha seu serviço, selecione a data e o horário e garanta sua vaga diretamente no calendário.",
    "badge.google": "<strong>Sincronização Direta</strong> · direto no calendário", "badge.pay": "<strong>Pagamento presencial</strong> · sem checkout online", "badge.only": "<strong>Apenas o Hugo</strong> · atendimento clássico e pessoal",
    "card.kicker": "Sistema de agendamento", "card.title": "Agende Diretamente", "card.divider": "fluxo customizado", "card.notice": "Selecione um horário ou clique em Começar Agendamento. Sua vaga já entra no Google Calendar do Hugo diretamente.",
    "preview.step1": "Etapa 1", "preview.service": "Escolher serviço", "preview.step2": "Etapa 2", "preview.details": "Selecione data/hora e dados", "preview.step3": "Etapa 3", "preview.google": "Agendamento direto",
    "about.kicker": "Desde 2011", "about.title": "Uma experiência de agendamento requintada para um corte requintado.", "about.body": "Hugo atende diretamente cada cliente no Goat Barbershop em Framingham. Este sistema verifica os horários disponíveis e registra sua reserva de forma direta e simples, sem intermediários.",
    "services.kicker": "Serviços", "services.title": "Disponíveis no agendamento", "services.body": "A página pública mostra o menu de serviços. Valores e durações aparecem dentro da experiência de agendamento.",
    "flow.kicker": "Como funciona", "flow.title": "Verifique os horários e reserve sua vaga.", "flow.one": "Selecione o seu serviço e se deseja lavagem opcional.", "flow.two": "Escolha um dia livre direto da agenda oficial do Hugo.", "flow.three": "Confirme o agendamento! O sistema reserva o horário e mostra o comprovante.",
    "location.kicker": "Localização", "location.map": "Abrir no Google Maps", "hours.title": "Horários", "hours.week": "Segunda a sábado", "hours.sunday": "Domingo", "hours.closed": "Fechado", "hours.note": "Clientes podem agendar com início até as 6:00 PM. Horários esgotam rapidamente.",
    "modal.kicker": "Reserve um Horário", "modal.title": "Agendar horário", "modal.subtitle": "Escolha o serviço, selecione o dia/horário ideal, preencha seus dados e confirme seu agendamento.", "modal.services": "1. Escolher serviço",
    "addon.title": "Adicionar lavagem e secagem", "addon.body": "Preferência opcional. Adiciona 10 minutos ao atendimento.",
    "addon.hotTowel.title": "Toalha quente", "addon.hotTowel.body": "Tratamento relaxante com toalha quente. Adiciona 15 minutos.",
    "field.name": "Seu Nome *", "field.phone": "Telefone de Contato *", "field.email": "E-mail (opcional)", "field.language": "Idioma de preferência", "field.notes": "Observações / Preferências para o Hugo",
    "summary.kicker": "Detalhes", "summary.title": "Dados do Agendamento", "summary.service": "Serviço", "summary.addon": "Adicional", "summary.duration": "Duração total", "summary.price": "Valor estimado", "summary.notice": "Ao clicar em 'Confirmar', seu agendamento é gravado direto no calendário real do Hugo. Cancele ou altere falando direto com ele.",
    "google.button": "Confirmar Agendamento", "none": "Nenhum", "wash": "Lavagem e secagem", "hotTowel": "Toalha quente", "optional": "opcional", "mins": "min", "selectService": "Por favor, escolha um serviço primeiro.",
    "field.date": "2. Escolher Data", "field.time": "4. Escolher Horário", "field.detailsHeader": "3. Seus Dados de Contato",
    "msg.booking": "Agendando seu horário...",
    "msg.success": "Seu horário foi adicionado ao calendário do Hugo. O pagamento é feito presencialmente.",
    "msg.failure": "Não foi possível adicionar este horário ao calendário do Hugo. Por favor, entre em contato diretamente com o Hugo."
  }
} as const;

export function t(key: keyof typeof copy['en'], lang: Language) {
  return copy[lang][key] || key;
}

export function money(value: number) {
  return "$" + value;
}
