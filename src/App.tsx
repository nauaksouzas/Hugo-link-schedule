import React, { useState, useEffect } from 'react';
import { Language, CONFIG, t, money } from './config';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(CONFIG.services[0].id);

  // Form State
  const [washDry, setWashDry] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientLang, setClientLang] = useState('English');
  const [clientNotes, setClientNotes] = useState('');

  // Schedulers & Live Constraints
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    // If it's after business hours, default tomorrow
    if (d.getHours() >= 18) {
      d.setDate(d.getDate() + 1);
    }
    // If Sunday, shift to Monday
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSundayClosed, setIsSundayClosed] = useState(false);
  const [isApiDemo, setIsApiDemo] = useState(false);

  // Notifications or Booking Outcomes
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Language side effect
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    setClientLang(lang === 'pt' ? 'Português' : 'English');
  }, [lang]);

  // Modal styling side effect
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isModalOpen]);

  const openModal = () => {
    setBookingSuccess(false);
    setErrorMsg('');
    setIsSubmitting(false);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  // Derived Values
  const selectedService = CONFIG.services.find(s => s.id === selectedServiceId) || null;
  const totalDuration = selectedService ? (selectedService.duration + (washDry ? 10 : 0)) : 0;
  const totalPrice = selectedService ? selectedService.price : 0;

  // Track availability
  useEffect(() => {
    if (!isModalOpen || !selectedServiceId || !selectedDate) return;

    let active = true;
    const loadAvailability = async () => {
      setLoadingSlots(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/availability?date=${selectedDate}&serviceId=${selectedServiceId}&washDry=${washDry}`);
        const data = await res.json();
        
        if (active) {
          if (!res.ok) {
            throw new Error(data.error || "Failed to load live availability slots.");
          }
          setAvailableSlots(data.slots || []);
          setIsApiDemo(!!data.isDemo);
          setIsSundayClosed(!!data.isClosed);
          // Reset time slot selection when parameters change
          setSelectedTimeSlot(null);
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err.message || 'Error occurred loading time slot database.');
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    };

    loadAvailability();
    return () => {
      active = false;
    };
  }, [selectedDate, selectedServiceId, washDry, isModalOpen]);

  // End time estimator
  const calculateEndTime = (startTimeStr: string, durationMinutes: number): string => {
    if (!startTimeStr) return '';
    const [hh, mm] = startTimeStr.split(':').map(Number);
    const totalMinutes = hh * 60 + mm + durationMinutes;
    const endHh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endMm = String(totalMinutes % 60).padStart(2, '0');
    return `${endHh}:${endMm}`;
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      showError(t('selectService', lang) as string);
      return;
    }
    if (!selectedTimeSlot) {
      showError(lang === 'pt' ? 'Por favor, escolha um horário.' : 'Please choose a time slot.');
      return;
    }
    if (!clientName.trim()) {
      showError(lang === 'pt' ? 'O campo Nome é obrigatório.' : 'Full name is required.');
      return;
    }
    if (!clientPhone.trim()) {
      showError(lang === 'pt' ? 'O campo Telefone é obrigatório.' : 'Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          washDry,
          date: selectedDate,
          time: selectedTimeSlot,
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim(),
          language: clientLang,
          notes: clientNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking.');
      }

      setBookingSuccess(true);
      setSuccessMsg(t('msg.success', lang));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(t('msg.failure', lang) + " (" + (err.message || 'Reason unknown') + ")");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (message: string) => {
    setErrorMsg(message);
    document.getElementById('bookingModal')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const todayStr = getLocalDateString(new Date());

  return (
    <>
      <header>
        <div className="wrap nav">
          <a className="brand" href="#top" aria-label="Hugo Barber home">
            <img src="/assets/logo.png" alt="Hugo Barber logo" />
            <strong>Hugo Barber</strong>
          </a>
          <nav className="navlinks" aria-label="Main navigation">
            <a href="#about">{t('nav.about', lang)}</a>
            <a href="#services">{t('nav.services', lang)}</a>
            <a href="#booking">{t('nav.booking', lang)}</a>
            <a href="#location">{t('nav.location', lang)}</a>
          </nav>
          <div className="nav-actions">
            <div className="lang-toggle" aria-label="Language switcher">
              <button 
                type="button" 
                className={lang === 'en' ? 'active' : ''} 
                onClick={() => setLang('en')}
              >EN</button>
              <button 
                type="button" 
                className={lang === 'pt' ? 'active' : ''} 
                onClick={() => setLang('pt')}
              >PT</button>
            </div>
            <button className="btn small" type="button" onClick={openModal}>{t('cta.book', lang)}</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="kicker">{t('hero.kicker', lang)}</div>
              <h1 dangerouslySetInnerHTML={{ __html: t('hero.title', lang) as string }} />
              <p className="lead">{t('hero.lead', lang)}</p>
              <div className="cta-row">
                <button className="btn" type="button" onClick={openModal}>{t('cta.bookFull', lang)}</button>
                <a className="btn secondary" href="#services">{t('cta.services', lang)}</a>
              </div>
              <div className="badge-row">
                <span className="badge" dangerouslySetInnerHTML={{ __html: t('badge.google', lang) as string }} />
                <span className="badge" dangerouslySetInnerHTML={{ __html: t('badge.pay', lang) as string }} />
                <span className="badge" dangerouslySetInnerHTML={{ __html: t('badge.only', lang) as string }} />
              </div>
            </div>

            <aside className="barber-card" id="booking">
              <div className="logo-lockup">
                <img src="/assets/logo.png" alt="Hugo Barber logo" />
                <div>
                  <div className="kicker">{t('card.kicker', lang)}</div>
                  <h2>{t('card.title', lang)}</h2>
                </div>
              </div>
              <div className="blade-divider">{t('card.divider', lang)}</div>
              <div className="appointment-preview">
                <div className="preview-row">
                  <div><small>{t('preview.step1', lang)}</small><strong>{t('preview.service', lang)}</strong></div>
                  <span>✂</span>
                </div>
                <div className="preview-row">
                  <div><small>{t('preview.step2', lang)}</small><strong>{t('preview.details', lang)}</strong></div>
                  <span>📅</span>
                </div>
                <div className="preview-row">
                  <div><small>{t('preview.step3', lang)}</small><strong>{t('preview.google', lang)}</strong></div>
                  <span>✨</span>
                </div>
              </div>
              <div className="notice">{t('card.notice', lang)}</div>
              <button className="btn full" type="button" onClick={openModal}>{t('cta.bookFull', lang)}</button>
            </aside>
          </div>
        </section>

        <section id="about">
          <div className="wrap two">
            <div>
              <div className="kicker">{t('about.kicker', lang)}</div>
              <h2>{t('about.title', lang)}</h2>
            </div>
            <div className="card">
              <p className="lead">{t('about.body', lang)}</p>
            </div>
          </div>
        </section>

        <section id="services">
          <div className="wrap">
            <div className="kicker">{t('services.kicker', lang)}</div>
            <h2>{t('services.title', lang)}</h2>
            <p className="lead">{t('services.body', lang)}</p>
            <div className="service-preview-grid">
              {CONFIG.services.map(service => (
                <article key={service.id} className="service-preview">
                  <div>
                    <small>{service.category}</small>
                    <strong>{service[lang]}</strong>
                  </div>
                  <small>{service.duration} {t('mins', lang)}</small>
                </article>
              ))}
            </div>
            <div className="cta-row">
              <button className="btn" type="button" onClick={openModal}>{t('cta.bookFull', lang)}</button>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">{t('flow.kicker', lang)}</div>
            <h2>{t('flow.title', lang)}</h2>
            <div className="booking-steps">
              <div className="step-card"><span>01</span><p>{t('flow.one', lang)}</p></div>
              <div className="step-card"><span>02</span><p>{t('flow.two', lang)}</p></div>
              <div className="step-card"><span>03</span><p>{t('flow.three', lang)}</p></div>
            </div>
          </div>
        </section>

        <section id="location">
          <div className="wrap two">
            <div>
              <div className="kicker">{t('location.kicker', lang)}</div>
              <h2>Goat Barbershop</h2>
              <p className="lead">39 South Street, Framingham, MA</p>
              <div className="cta-row">
                <a className="btn secondary" href="https://www.google.com/maps/search/?api=1&query=39%20South%20Street%20Framingham%20MA" target="_blank" rel="noopener noreferrer">{t('location.map', lang)}</a>
                <button className="btn" type="button" onClick={openModal}>{t('cta.bookFull', lang)}</button>
              </div>
            </div>
            <div className="card contact-card">
              <h2>{t('hours.title', lang)}</h2>
              <p><strong>{t('hours.week', lang)}</strong><br /><span>9:00 AM – 6:00 PM</span></p>
              <p><strong>{t('hours.sunday', lang)}</strong><br /><span>{t('hours.closed', lang)}</span></p>
              <div className="notice">{t('hours.note', lang)}</div>
              <p><strong>Phone</strong><br />(504) 754-0419</p>
              <p><strong>Email</strong><br />hugogoncalves2000@icloud.com</p>
            </div>
          </div>
        </section>
      </main>

      <div 
        className={"modal-backdrop " + (isModalOpen ? 'open' : '')} 
        id="bookingModal" 
        aria-hidden={!isModalOpen}
        onClick={(e) => {
          if ((e.target as HTMLElement).id === 'bookingModal') closeModal();
        }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="bookingTitle">
          <div className="modal-head">
            <div>
              <div className="kicker">{t('modal.kicker', lang)}</div>
              <h2 id="bookingTitle">{t('modal.title', lang)}</h2>
              <p>{t('modal.subtitle', lang)}</p>
            </div>
            <button className="close" type="button" onClick={closeModal} aria-label="Close booking">×</button>
          </div>

          {!bookingSuccess ? (
            <form onSubmit={handleConfirmBooking} className="booking-layout">
              <div className="booking-main" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                {errorMsg && (
                  <div className="notice" style={{ borderColor: 'var(--danger)', background: 'rgba(255, 180, 168, 0.12)', color: 'var(--danger)' }}>
                    {errorMsg}
                  </div>
                )}

                {isApiDemo && (
                  <div className="notice" style={{ borderColor: '#e1ad46', background: 'rgba(225, 173, 70, 0.08)', color: '#f1cf83' }}>
                    {lang === 'pt' ? '⚠️ Hugo não conectou sua conta Google neste ambiente ainda. Rodando em modo de Demonstração.' : '⚠️ Hugo has not connected Google Calendar yet. Running in Demo Simulation Mode.'}
                  </div>
                )}

                <div className="kicker" style={{ marginBottom: 12 }}>{t('modal.services', lang)}</div>
                <div className="service-list">
                  {CONFIG.services.map(service => (
                    <button 
                      key={service.id}
                      type="button" 
                      className={"service-option " + (selectedServiceId === service.id ? 'active' : '')}
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      <div className="top">
                        <div>
                          <h3 style={{ fontSize: '15px', color: 'var(--cream)' }}>{service[lang]}</h3>
                          <span className="duration" style={{ marginTop: '4px' }}>{service.duration} {t('mins', lang)}</span>
                        </div>
                        <span className="price">{money(service.price)}</span>
                      </div>
                      {service.includes && <div className="includes">{service.includes}</div>}
                    </button>
                  ))}
                </div>

                <label className="checkbox" style={{ marginTop: '18px', marginBottom: '18px' }}>
                  <input type="checkbox" checked={washDry} onChange={(e) => setWashDry(e.target.checked)} />
                  <span>
                    <strong>{t('addon.title', lang)}</strong><br />
                    <span>{t('addon.body', lang)}</span>
                  </span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
                  <label className="field">
                    <span>{t('field.date', lang)}</span>
                    <input 
                      type="date" 
                      className="input" 
                      min={todayStr} 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      required 
                    />
                  </label>
                  <div className="field">
                    <span>{t('field.language', lang)}</span>
                    <select className="input" value={clientLang} onChange={(e) => setClientLang(e.target.value)}>
                      <option value="English">English</option>
                      <option value="Português">Português</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <div className="kicker" style={{ marginBottom: '8px' }}>{t('field.time', lang)}</div>
                  {isSundayClosed ? (
                    <div style={{ padding: '16px', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,180,168,0.05)' }}>
                      {lang === 'pt' ? 'Domingo Fechado. Por favor, escolha de Segunda a Sábado.' : 'Sunday Closed. Please select Monday to Saturday.'}
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center py-4 text-[#bcae96] animate-pulse">
                      {lang === 'pt' ? 'Carregando disponibilidade...' : 'Loading live Google limits...'}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: '16px', border: '1px solid var(--line)', color: 'var(--muted)', borderRadius: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                      {lang === 'pt' ? 'Sem horários livres para esta data. Escolha outro dia ou fale com Hugo.' : 'No available slots for this date. Choose another day or contact Hugo directly.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-[#c99a3c]/18 rounded-xl bg-black/40">
                      {availableSlots.map(timeStr => (
                        <button
                          key={timeStr}
                          type="button"
                          onClick={() => setSelectedTimeSlot(timeStr)}
                          className={`px-2 py-2 text-center rounded-lg font-mono text-sm border transition-all duration-150 ${
                            selectedTimeSlot === timeStr
                              ? 'bg-[#c99a3c]/30 border-[#f1cf83] text-[#f1cf83] font-bold shadow-md'
                              : 'bg-white/5 border-[rgba(201,154,60,0.25)] text-cream hover:bg-[rgba(201,154,60,0.12)] hover:border-[#f1cf83]'
                          }`}
                        >
                          {timeStr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="kicker" style={{ marginTop: '24px', marginBottom: '8px' }}>{t('field.detailsHeader', lang)}</div>
                <div className="field-row" style={{ marginTop: '0px' }}>
                  <label className="field">
                    <span>{t('field.name', lang)}</span>
                    <input className="input" placeholder="Your full name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                  </label>
                  <label className="field">
                    <span>{t('field.phone', lang)}</span>
                    <input className="input" placeholder="(000) 000-0000" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                  </label>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <label className="field">
                    <span>{t('field.email', lang)}</span>
                    <input type="email" className="input" placeholder="name@example.com (optional)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                  </label>
                </div>

                <label className="field" style={{ marginTop: 18 }}>
                  <span>{t('field.notes', lang)}</span>
                  <textarea className="input" placeholder="Fade detail, hot-towel details, haircut preferences, beard style..." value={clientNotes} onChange={(e) => setClientNotes(e.target.value)}></textarea>
                </label>
              </div>

              <aside className="booking-side">
                <div className="kicker">{t('summary.kicker', lang)}</div>
                <h3>{t('summary.title', lang)}</h3>
                <div className="summary-line">
                  <span>{t('summary.service', lang)}</span>
                  <strong>{selectedService ? selectedService[lang] : '—'}</strong>
                </div>
                <div className="summary-line">
                  <span>{t('summary.addon', lang)}</span>
                  <strong>{washDry ? t('wash', lang) + " (+10 " + t('mins', lang) + ")" : t('none', lang)}</strong>
                </div>
                <div className="summary-line">
                  <span>{t('summary.duration', lang)}</span>
                  <strong>{selectedService ? (totalDuration + ' ' + t('mins', lang)) : '—'}</strong>
                </div>
                <div className="summary-line">
                  <span>{t('summary.price', lang)}</span>
                  <strong>{selectedService ? money(totalPrice) : '—'}</strong>
                </div>

                {selectedTimeSlot && (
                  <div className="summary-line" style={{ color: '#f1cf83' }}>
                    <span>{lang === 'pt' ? 'Dia e Horário' : 'Date & Time'}</span>
                    <strong>{selectedDate} @ {selectedTimeSlot}<br />
                      <span className="text-xs text-muted font-normal block">
                        {lang === 'pt' ? 'Término Estimado:' : 'Est. End:'} {calculateEndTime(selectedTimeSlot, totalDuration)}
                      </span>
                    </strong>
                  </div>
                )}

                <div className="notice">{t('summary.notice', lang)}</div>

                <div className="action-stack">
                  <button 
                    className="btn full" 
                    type="submit" 
                    disabled={isSubmitting || !selectedService || !selectedTimeSlot || isSundayClosed}
                  >
                    {isSubmitting ? (lang === 'pt' ? 'Processando...' : 'Booking Spot...') : t('google.button', lang)}
                  </button>
                  <button className="btn secondary full" type="button" onClick={closeModal}>{lang === 'pt' ? 'Cancelar' : 'Cancel'}</button>
                </div>
              </aside>
            </form>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#0e0c09', borderTop: '1px solid rgba(201,154,60,0.2)' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>✨</div>
              <h2 style={{ color: 'var(--gold-2)', fontSize: '32px', marginBottom: '16px' }}>
                {lang === 'pt' ? 'Reserva Realizada!' : 'Appointment Confirmed!'}
              </h2>
              <div 
                className="notice" 
                style={{ 
                  maxWidth: '560px', 
                  margin: '0 auto 24px', 
                  borderColor: 'var(--gold)', 
                  background: 'rgba(201,154,60,0.08)', 
                  color: '#eadbc0',
                  textAlign: 'left'
                }}
              >
                {successMsg}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,154,60,0.2)', borderRadius: '18px', padding: '20px', maxWidth: '560px', margin: '0 auto 30px', textAlign: 'left' }}>
                <div className="summary-line">
                  <span>{lang === 'pt' ? 'Serviço' : 'Service'}</span>
                  <strong>{selectedService ? selectedService[lang] : ''}</strong>
                </div>
                <div className="summary-line">
                  <span>{lang === 'pt' ? 'Lavagem e Secagem' : 'Wash & Dry'}</span>
                  <strong>{washDry ? (lang === 'pt' ? 'Sim (+10 min)' : 'Yes (+10 mins)') : (lang === 'pt' ? 'Não' : 'No')}</strong>
                </div>
                <div className="summary-line">
                  <span>{lang === 'pt' ? 'Duração Total' : 'Total Duration'}</span>
                  <strong>{totalDuration} {t('mins', lang)}</strong>
                </div>
                <div className="summary-line">
                  <span>{lang === 'pt' ? 'Valor Est.' : 'Est. Price'}</span>
                  <strong>{money(totalPrice)}</strong>
                </div>
                <div className="summary-line" style={{ borderBottom: 0 }}>
                  <span>{lang === 'pt' ? 'Horário Confirmado' : 'Confirmed Slot'}</span>
                  <strong style={{ color: 'var(--gold-2)' }}>{selectedDate} @ {selectedTimeSlot}</strong>
                </div>
              </div>

              <button className="btn" type="button" onClick={closeModal} style={{ minWidth: '180px' }}>
                {lang === 'pt' ? 'Fechar Janela' : 'Close Window'}
              </button>
            </div>
          )}
        </div>
      </div>

      <footer>
        <div className="wrap">© {new Date().getFullYear()} Hugo Barber · Goat Barbershop · Framingham, MA</div>
      </footer>
    </>
  );
}
