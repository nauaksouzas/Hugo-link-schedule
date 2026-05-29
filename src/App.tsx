import React, { useState, useEffect } from 'react';
import { Language, CONFIG, t, money } from './config';
import { HugoBarberLogo } from './components/HugoBarberLogo';
import { CalendarPicker } from './components/CalendarPicker';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([CONFIG.services[0].id]);

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

  // Notifications or Booking Outcomes
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);

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
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setBookingStep(1);
      setBookingSuccess(false);
      setErrorMsg('');
    }, 300);
  };

  // Derived Values
  const selectedServices = CONFIG.services.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0) + (washDry ? 10 : 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Track availability
  useEffect(() => {
    if (!isModalOpen || selectedServiceIds.length === 0 || !selectedDate) return;

    let active = true;
    const loadAvailability = async () => {
      setLoadingSlots(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/availability?date=${selectedDate}&serviceIds=${selectedServiceIds.join(',')}&washDry=${washDry}`);
        let data;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Server returned an invalid response (Status ${res.status}): ${text.substring(0, 100)}...`);
        }
        
        if (active) {
          if (!res.ok) {
            throw new Error(data.error || "Failed to load live availability slots.");
          }
          setAvailableSlots(data.slots || []);
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
  }, [selectedDate, selectedServiceIds, washDry, isModalOpen]);

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
    if (selectedServiceIds.length === 0) {
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
          serviceIds: selectedServiceIds,
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

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (Status ${res.status}): ${text.substring(0, 100)}...`);
      }

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="wrap nav flex items-center justify-between h-[64px] sm:h-[80px]">
          <a className="brand flex items-center gap-3" href="#top" aria-label="Hugo Barber home">
            <HugoBarberLogo size="sm" />
            <strong className="tracking-[0.1em] text-cream uppercase text-[12px] sm:text-[14px] font-semibold truncate">HUGO BARBER</strong>
          </a>
          <nav className="navlinks hidden md:flex items-center gap-8 font-medium text-[14px]" aria-label="Main navigation">
            <a href="#about" className="text-white/70 hover:text-gold-2 transition-colors">{t('nav.about', lang)}</a>
            <a href="#services" className="text-white/70 hover:text-gold-2 transition-colors">{t('nav.services', lang)}</a>
            <a href="#booking" className="text-white/70 hover:text-gold-2 transition-colors">{t('nav.booking', lang)}</a>
            <a href="#location" className="text-white/70 hover:text-gold-2 transition-colors">{t('nav.location', lang)}</a>
          </nav>
          <div className="nav-actions flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex bg-white/5 border border-white/10 rounded-full overflow-hidden p-1">
              <button 
                type="button" 
                className={`px-4 py-1.5 text-[11px] font-bold tracking-wider rounded-full transition-colors ${lang === 'en' ? 'bg-[#c99a3c]/20 text-[#fcebaf]' : 'text-white/60 hover:text-white'}`} 
                onClick={() => setLang('en')}
              >EN</button>
              <button 
                type="button" 
                className={`px-4 py-1.5 text-[11px] font-bold tracking-wider rounded-full transition-colors ${lang === 'pt' ? 'bg-[#c99a3c]/20 text-[#fcebaf]' : 'text-white/60 hover:text-white'}`} 
                onClick={() => setLang('pt')}
              >PT</button>
            </div>
            {/* Mobile Lang Button */}
            <div className="md:hidden flex bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
              <button 
                type="button" 
                className={`px-2 py-1 text-[10px] font-bold rounded-full transition-colors ${lang === 'en' ? 'bg-[#c99a3c]/20 text-[#fcebaf]' : 'text-white/60'}`} 
                onClick={() => setLang('en')}
              >EN</button>
              <button 
                type="button" 
                className={`px-2 py-1 text-[10px] font-bold rounded-full transition-colors ${lang === 'pt' ? 'bg-[#c99a3c]/20 text-[#fcebaf]' : 'text-white/60'}`} 
                onClick={() => setLang('pt')}
              >PT</button>
            </div>
            
            <button className="btn small !text-[12px] sm:!text-[13px] !px-4 sm:!px-5 !py-2 !min-h-0 h-[36px] sm:h-[40px] whitespace-nowrap" type="button" onClick={openModal}>
              <span className="hidden sm:inline">{t('cta.book', lang)}</span>
              <span className="sm:hidden">{lang === 'pt' ? 'Agendar' : 'Book'}</span>
            </button>
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
                <HugoBarberLogo size="md" />
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
              <div className="contact-item">
                <strong>{t('hours.week', lang)}</strong>
                <span>9:00 AM – 6:00 PM</span>
              </div>
              <div className="contact-item">
                <strong>{t('hours.sunday', lang)}</strong>
                <span>{t('hours.closed', lang)}</span>
              </div>
              
              <div className="contact-item">
                <strong>Phone</strong>
                <span>(504) 754-0419</span>
              </div>
              
              <div className="contact-item">
                <strong>Email</strong>
                <span>hugogoncalves2000@icloud.com</span>
              </div>
              <div className="notice" style={{ marginTop: '16px', marginBottom: 0 }}>{t('hours.note', lang)}</div>
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
            <div className="flex-1">
              <h2 id="bookingTitle" className="font-serif text-gold-2">{t('modal.title', lang)}</h2>
              {!bookingSuccess && (
                <div className="md:hidden mt-2">
                  <div className="text-muted text-[11px] font-bold mb-1 uppercase tracking-wider">{lang === 'pt' ? 'Etapa' : 'Step'} {bookingStep} {lang === 'pt' ? 'de' : 'of'} 6</div>
                  <div className="bg-white/10 h-1.5 rounded-full overflow-hidden w-full max-w-[200px]">
                    <div className="bg-gold-2 h-full rounded-full transition-all duration-300" style={{ width: `${(bookingStep / 6) * 100}%` }}></div>
                  </div>
                </div>
              )}
              {!bookingSuccess && (
                <p className="hidden md:block mt-1">{t('modal.subtitle', lang)}</p>
              )}
            </div>
            <button className="close" type="button" onClick={closeModal} aria-label="Close booking">×</button>
          </div>

          <div className="modal-body">
            <div className="booking-main-area">
              {!bookingSuccess ? (
                <form id="bookingForm" onSubmit={handleConfirmBooking} className="booking-main-content">
                  
                  {errorMsg && (
                    <div className="notice" style={{ borderColor: 'var(--danger)', background: 'rgba(255, 180, 168, 0.12)', color: 'var(--danger)', marginBottom: 24 }}>
                      {errorMsg}
                    </div>
                  )}
                  
                  {/* DESKTOP PROGRESS */}
                  <div className="hidden md:block step-indicator mb-8">
                    <span className="text-muted text-sm font-semibold">{lang === 'pt' ? 'Etapa' : 'Step'} {bookingStep} {lang === 'pt' ? 'de' : 'of'} 6</span>
                    <div className="progress-bar mt-2 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#c99a3c] h-full rounded-full transition-all duration-300" style={{ width: `${(bookingStep / 6) * 100}%` }}></div>
                    </div>
                  </div>

                  {bookingStep === 1 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '1. Escolha o serviço principal' : '1. Choose main service'}</div>
                      <div className="service-list">
                        {CONFIG.services.map(service => {
                          const isActive = selectedServiceIds.includes(service.id);
                          return (
                            <button 
                              key={service.id}
                              type="button" 
                              className={"service-option relative " + (isActive ? 'active shadow-[0_0_0_2px_#c99a3c]' : '')}
                              onClick={() => {
                                setSelectedServiceIds(prev => {
                                  if (prev.includes(service.id)) {
                                    return prev.filter(id => id !== service.id);
                                  }
                                  return [...prev, service.id];
                                });
                              }}
                            >
                              {isActive && (
                                <div className="absolute top-4 right-4 text-gold-2">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                </div>
                              )}
                              <div className="top pr-8">
                                <div>
                                  <h3 style={{ fontSize: '16px', color: 'var(--cream)', fontWeight: 600 }}>{service[lang]}</h3>
                                  <span className="duration" style={{ marginTop: '6px' }}>{service.duration} {t('mins', lang)}</span>
                                </div>
                                <span className="price text-lg font-bold">{money(service.price)}</span>
                              </div>
                              {service.includes && <div className="includes">{service.includes}</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {bookingStep === 2 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '2. Adicionais opcionais' : '2. Optional Add-ons'}</div>
                      <div className="grid grid-cols-1 gap-4">
                        <label className={`checkbox m-0 border ${washDry ? 'border-gold-2 bg-[rgba(232,202,140,0.05)]' : 'border-[rgba(232,202,140,0.15)] bg-[rgba(255,255,255,0.02)]'} rounded-2xl p-5 cursor-pointer transition-all hover:border-gold-2 hover:bg-[rgba(232,202,140,0.05)] flex items-start gap-4`}>
                          <input type="checkbox" checked={washDry} onChange={(e) => setWashDry(e.target.checked)} className="mt-1 w-5 h-5 rounded border-gray-600 bg-black/50 text-gold-2 focus:ring-gold-2 focus:ring-offset-black" />
                          <span>
                            <strong className="text-lg block mb-1 text-cream font-medium">{t('addon.title', lang)}</strong>
                            <span className="text-muted text-sm">{t('addon.body', lang)}</span>
                            <div className="text-gold-2 text-sm mt-3 font-semibold">+10 {t('mins', lang)}</div>
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {bookingStep === 3 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '3. Escolha a data' : '3. Choose date'}</div>
                      <CalendarPicker 
                        lang={lang}
                        selectedDate={selectedDate}
                        onChange={(dateStr) => {
                          setSelectedDate(dateStr);
                          setSelectedTimeSlot(null);
                        }}
                      />
                    </div>
                  )}

                  {bookingStep === 4 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '4. Escolha o horário' : '4. Choose time'}</div>
                      <div className="text-muted text-sm mb-4">
                        {lang === 'pt' ? 'Data selecionada:' : 'Selected date:'} <strong className="text-cream">{selectedDate}</strong>
                      </div>

                      {isSundayClosed ? (
                        <div className="p-4 border border-red-500/30 text-red-400 rounded-xl text-center bg-red-500/10 mb-4">
                          {lang === 'pt' ? 'Domingo Fechado. Por favor, escolha de Segunda a Sábado (Etapa 3).' : 'Sunday Closed. Please select Monday to Saturday (Step 3).'}
                        </div>
                      ) : loadingSlots ? (
                        <div className="text-center py-12 text-[#bcae96] animate-pulse">
                          {lang === 'pt' ? 'Buscando horários disponíveis...' : 'Loading available times...'}
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-6 border border-white/10 text-muted rounded-xl text-center bg-white/5 mb-4 mt-6">
                          {lang === 'pt' ? 'Sem horários livres para esta data. Escolha outro dia.' : 'No available slots for this date. Choose another day.'}
                          <button type="button" className="btn secondary block mt-4 mx-auto btn-sm" onClick={() => setBookingStep(3)}>
                             {lang === 'pt' ? 'Voltar para Data' : 'Back to Date'}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                          {availableSlots.map(timeStr => (
                            <button
                              key={timeStr}
                              type="button"
                              onClick={() => setSelectedTimeSlot(timeStr)}
                              className={`px-3 py-4 text-center rounded-xl font-mono text-[16px] border transition-all duration-150 ${
                                selectedTimeSlot === timeStr
                                  ? 'bg-[#c99a3c]/30 border-[#f1cf83] text-[#f1cf83] font-bold shadow-[0_4px_12px_rgba(201,154,60,0.3)]'
                                  : 'bg-[#1a1711] border-[#362f22] text-cream hover:bg-[#262118] hover:border-[#c99a3c] shadow-sm'
                              }`}
                            >
                              {timeStr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {bookingStep === 5 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '5. Seus dados' : '5. Your details'}</div>
                      <div className="field-row" style={{ marginTop: 0 }}>
                        <label className="field">
                          <span>{t('field.name', lang)}</span>
                          <input className="input" placeholder="Your full name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                        </label>
                        <label className="field">
                          <span>{t('field.phone', lang)}</span>
                          <input className="input" placeholder="(000) 000-0000" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
                        </label>
                      </div>
                      <div className="field-row" style={{ marginTop: 16 }}>
                        <label className="field">
                          <span>{t('field.email', lang)}</span>
                          <input type="email" className="input" placeholder="name@example.com (optional)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                        </label>
                        <div className="field">
                          <span>{t('field.language', lang)}</span>
                          <select className="input" value={clientLang} onChange={(e) => setClientLang(e.target.value)}>
                            <option value="English">English</option>
                            <option value="Português">Português</option>
                          </select>
                        </div>
                      </div>
                      <label className="field" style={{ marginTop: 16 }}>
                        <span>{t('field.notes', lang)}</span>
                        <textarea className="input" placeholder="Fade detail, hot-towel details..." value={clientNotes} onChange={(e) => setClientNotes(e.target.value)}></textarea>
                      </label>
                    </div>
                  )}

                  {bookingStep === 6 && (
                    <div className="step-content">
                      <div className="kicker" style={{ marginBottom: 16 }}>{lang === 'pt' ? '6. Revisar e Confirmar' : '6. Review and Confirm'}</div>
                      
                      <div className="p-5 border border-[#c99a3c]/20 bg-[#161410] shadow-md rounded-xl mb-6 md:hidden">
                        <h3 className="text-xl text-gold-2 mb-4 font-serif">{t('summary.title', lang)}</h3>
                        
                        <div className="summary-line pt-0">
                          <span>{t('summary.service', lang)}</span>
                          <strong className="text-right">{selectedServices.length > 0 ? selectedServices.map(s => s[lang]).join(', ') : '—'}</strong>
                        </div>
                        <div className="summary-line flex-col sm:flex-row sm:items-center">
                          <span>{t('summary.addon', lang)}</span>
                          <strong>
                            {[
                              washDry ? t('wash', lang) + " (+10 " + t('mins', lang) + ")" : null
                            ].filter(Boolean).join(', ') || t('none', lang)}
                          </strong>
                        </div>
                        <div className="summary-line">
                          <span>{t('summary.duration', lang)}</span>
                          <strong>{selectedServices.length > 0 ? (totalDuration + ' ' + t('mins', lang)) : '—'}</strong>
                        </div>
                        <div className="summary-line" style={{ borderBottomColor: 'rgba(232, 202, 140, 0.4)' }}>
                          <span>{t('summary.price', lang)}</span>
                          <strong className="text-gold-2 text-lg">{selectedServices.length > 0 ? money(totalPrice) : '—'}</strong>
                        </div>

                        {selectedTimeSlot && (
                          <div className="summary-line border-b-0 pb-0 pt-5 text-gold-2">
                            <span>{lang === 'pt' ? 'Horário' : 'Time'}</span>
                            <strong className="text-right">
                              <span className="block text-lg">{selectedDate} @ {selectedTimeSlot}</span>
                              <span className="text-xs text-muted font-normal block mt-1">
                                {lang === 'pt' ? 'Término Reservado:' : 'Est. End:'} {calculateEndTime(selectedTimeSlot, totalDuration)}
                              </span>
                            </strong>
                          </div>
                        )}
                      </div>
                      
                      <div className="notice text-sm !mb-0">{t('summary.notice', lang)}</div>
                    </div>
                  )}

                  <div className="step-actions-bar">
                    {bookingStep > 1 && (
                      <button type="button" className="btn secondary" onClick={() => setBookingStep(s => s - 1)}>
                        {lang === 'pt' ? 'Voltar' : 'Back'}
                      </button>
                    )}
                    
                    {bookingStep < 6 && (
                      <button 
                        type="button" 
                        className="btn flex-1" 
                        onClick={() => setBookingStep(s => s + 1)}
                        disabled={
                          (bookingStep === 1 && selectedServiceIds.length === 0) || 
                          (bookingStep === 3 && !selectedDate) || 
                          (bookingStep === 4 && (!selectedTimeSlot || isSundayClosed))
                        }
                      >
                        {lang === 'pt' ? 'Continuar' : 'Continue'}
                      </button>
                    )}

                    {bookingStep === 6 && (
                      <button 
                        className="btn flex-1" 
                        type="submit" 
                        disabled={isSubmitting || selectedServiceIds.length === 0 || !selectedTimeSlot || isSundayClosed}
                      >
                        {isSubmitting ? (lang === 'pt' ? 'Processando...' : 'Booking Spot...') : t('google.button', lang)}
                      </button>
                    )}
                  </div>

                </form>
              ) : (
                <div className="booking-main-content justify-center items-center text-center p-8">
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

                  <div className="w-full max-w-[560px] text-left mx-auto mb-8 bg-white/5 border border-[#c99a3c]/20 rounded-[18px] p-5">
                    <div className="summary-line">
                      <span>{lang === 'pt' ? 'Serviço' : 'Service'}</span>
                      <strong>{selectedServices.length > 0 ? selectedServices.map(s => s[lang]).join(', ') : ''}</strong>
                    </div>
                    <div className="summary-line">
                      <span>{lang === 'pt' ? 'Adicionais' : 'Add-ons'}</span>
                      <strong className="text-right">
                        {[
                          washDry ? (lang === 'pt' ? 'Lavagem (+10 min)' : 'Wash & Dry (+10 mins)') : null
                        ].filter(Boolean).join(', ') || (lang === 'pt' ? 'Nenhum' : 'None')}
                      </strong>
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

            {/* Desktop Sidebar Summary */}
            <aside className="booking-sidebar">
              <div className="kicker mb-4">{t('summary.kicker', lang)}</div>
              <h3 className="text-xl text-gold-2 mb-6 font-serif">{t('summary.title', lang)}</h3>
              
              <div className="summary-line pt-0">
                <span>{t('summary.service', lang)}</span>
                <strong className="text-right">{selectedServices.length > 0 ? selectedServices.map(s => s[lang]).join(', ') : '—'}</strong>
              </div>
              <div className="summary-line">
                <span>{t('summary.addon', lang)}</span>
                <strong className="text-right">
                  {[
                    washDry ? (lang === 'pt' ? 'Lavagem (+10 min)' : 'Wash (+10)') : null
                  ].filter(Boolean).join(', ') || '—'}
                </strong>
              </div>
              <div className="summary-line">
                <span>{t('summary.duration', lang)}</span>
                <strong className="text-right">{selectedServices.length > 0 ? (totalDuration + ' min') : '—'}</strong>
              </div>
              <div className="summary-line" style={{ borderBottomColor: 'rgba(232, 202, 140, 0.4)' }}>
                <span>{t('summary.price', lang)}</span>
                <strong className="text-gold-2 text-lg text-right">{selectedServices.length > 0 ? money(totalPrice) : '—'}</strong>
              </div>

              {selectedTimeSlot && (
                <div className="summary-line border-b-0 pb-0 pt-5 text-gold-2 flex-col items-start gap-2">
                  <span>{lang === 'pt' ? 'Horário' : 'Time'}</span>
                  <strong className="text-left">
                    <span className="block text-lg">{selectedDate}</span>
                    <span className="block text-xl font-bold mt-1">{selectedTimeSlot}</span>
                    <span className="text-xs text-white/50 font-normal block mt-2">
                      {lang === 'pt' ? 'Término Reserva:' : 'Est. End:'} {calculateEndTime(selectedTimeSlot, totalDuration)}
                    </span>
                  </strong>
                </div>
              )}
              
              {bookingStep === 6 && (
                <div className="mt-8 text-xs text-white/50">
                  {t('summary.notice', lang)}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">© {new Date().getFullYear()} Hugo Barber · Goat Barbershop · Framingham, MA</div>
      </footer>
    </>
  );
}
