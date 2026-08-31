'use client';

import React, { useState, useEffect } from 'react';
import {
  login,
  logout,
  getCurrentUser,
  getUsers,
  createUser,
  deleteUser,
  getTripsData,
  createTrip,
  deleteTrip,
  createClient,
  deleteClient,
  createDestination,
  deleteDestination,
  createDisposalPrice,
  deleteDisposalPrice,
  createTransportPrice,
  deleteTransportPrice,
  upsertDisposalPrice,
  upsertTransportPrice,
  createDriver,
  deleteDriver,
  createVehicle,
  deleteVehicle,
  createWasteType,
  deleteWasteType,
  getSchedulesData,
  getWeeklySchedulesData,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from './actions';

// Helper per formattare i numeri come valuta (€)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

// Helper per formattare i pesi
const formatWeight = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'registro' | 'pianificazione' | 'anagrafiche' | 'listini' | 'utenti'>('registro');
  const [anagraficaSubTab, setAnagraficaSubTab] = useState<'clienti' | 'destinatari' | 'autisti' | 'mezzi' | 'cer'>('clienti');
  const [listinoSubTab, setListinoSubTab] = useState<'smaltimento' | 'trasporti'>('smaltimento');
  
  // Dati dal database
  const [trips, setTrips] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [disposalPrices, setDisposalPrices] = useState<any[]>([]);
  const [transportPrices, setTransportPrices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Stati per la pianificazione
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const yyyy = monday.getFullYear();
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState<{
    id?: number;
    driverId: string;
    vehicleId: string;
    startDate: string;
    endDate: string;
    notes: string;
  }>({
    driverId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Caricamento stati
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filtri registro
  const [filterCliente, setFilterCliente] = useState<string>('ALL');
  const [filterMese, setFilterMese] = useState<string>('ALL');

  // Modali inserimento
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Search input state for searchable selectors
  const [cerSearchInput, setCerSearchInput] = useState('');
  const [isCerDropdownOpen, setIsCerDropdownOpen] = useState(false);
  const [driverSearchInput, setDriverSearchInput] = useState('');
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [vehicleSearchInput, setVehicleSearchInput] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [destSearchInput, setDestSearchInput] = useState('');
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);

  // Form states
  const [loginError, setLoginError] = useState('');
  const [selectedTripClientId, setSelectedTripClientId] = useState('');
  const [newTripData, setNewTripData] = useState({
    date: '',
    firNumber: '',
    wasteTypeId: '',
    weight: '',
    cerPrice: '',
    transportPrice: '',
    disposalPrice: '',
    fuoriRomaPrice: '0',
    noleggioPrice: '0',
    bigBagPrice: '0',
    analisiPrice: '0',
    servRagnoPrice: '0',
    sostaPrice: '0',
    address: '',
    notes: '',
    destinationId: '',
    driverId: '',
    vehicleId: '',
  });

  const [newClientData, setNewClientData] = useState({ name: '', billingAddress: '', vatNumber: '', clientCode: '' });
  const [newDestinationData, setNewDestinationData] = useState({ name: '', address: '', shippingCode: '', clientId: '' });
  const [newDriverData, setNewDriverData] = useState({ name: '', email: '', phone: '', licenseNumber: '' });
  const [newVehicleData, setNewVehicleData] = useState({ plateNumber: '', model: '', capacity: '' });
  const [newWasteData, setNewWasteData] = useState({ cerCode: '', description: '' });
  const [newUserData, setNewUserData] = useState({ email: '', name: '', password: '', role: 'OPERATOR' });
  const [newDisposalPriceData, setNewDisposalPriceData] = useState({ clientId: '', wasteTypeId: '', pricePerQuintal: '' });
  const [newTransportPriceData, setNewTransportPriceData] = useState({ clientId: '', vehicleId: '', price: '' });
  const [cerSearchQuery, setCerSearchQuery] = useState('');
  const [cerCategoryFilter, setCerCategoryFilter] = useState('');

  // Traccia la sorgente del prezzo per cerPrice, transportPrice, disposalPrice
  // 'client-list' = da listino cliente, 'base-list' = da listino base, 'manual' = inserito a mano, '' = vuoto
  const [priceSource, setPriceSource] = useState<{
    cerPrice: 'client-list' | 'base-list' | 'manual' | '';
    transportPrice: 'client-list' | 'base-list' | 'manual' | '';
    disposalPrice: 'client-list' | 'base-list' | 'manual' | '';
  }>({ cerPrice: '', transportPrice: '', disposalPrice: '' });

  // Modale conferma "Salva in listino?"
  const [isListinoConfirmOpen, setIsListinoConfirmOpen] = useState(false);
  const [pendingListinoSave, setPendingListinoSave] = useState<{
    cerPrice?: { wasteTypeId: number; clientId: number | null; pricePerQuintal: number; cerCode: string; clientName: string };
    transportPrice?: { vehicleId: number; clientId: number | null; price: number; plateNumber: string; clientName: string };
  } | null>(null);

  // Caricamento iniziale sessione e dati
  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await refreshData(user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Inizializzazione fallita:', err);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Ricarica tutti i dati dal DB
  async function refreshData(user = currentUser) {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTripsData();
      setTrips(data.trips || []);
      setClients(data.clients || []);
      setDestinations(data.destinations || []);
      setDrivers(data.drivers || []);
      setVehicles(data.vehicles || []);
      setWasteTypes(data.wasteTypes || []);
      setDisposalPrices(data.disposalPrices || []);
      setTransportPrices(data.transportPrices || []);

      if (user.role === 'ADMIN') {
        const userList = await getUsers();
        setUsers(userList || []);
      }

      await refreshSchedules(currentCalendarDate);
    } catch (e) {
      console.error('Errore ricaricamento dati:', e);
    } finally {
      setLoading(false);
    }
  }

  async function refreshSchedules(weekStart = currentCalendarDate) {
    try {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      
      const res = await getWeeklySchedulesData(weekStart, endStr);
      if (res.success) {
        setSchedules(res.schedules || []);
      } else {
        console.error('Errore caricamento pianificazioni settimanali:', res.error);
      }
    } catch (e) {
      console.error('refreshSchedules error:', e);
    }
  }

  useEffect(() => {
    if (currentUser && activeTab === 'pianificazione') {
      refreshSchedules(currentCalendarDate);
    }
  }, [currentCalendarDate, activeTab, currentUser]);

  // Azione di Login
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');
    const formData = new FormData(e.currentTarget);
    const res = await login(null, formData);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      await refreshData(res.user);
    } else {
      setLoginError(res.error || 'Credenziali non valide.');
    }
  };

  // Azione di Logout
  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setTrips([]);
    setIsMenuOpen(false);
  };

  // Filtraggio viaggi
  const filteredTrips = trips.filter((trip) => {
    // Filtro per Cliente di fatturazione (legato alla destinazione del viaggio)
    if (filterCliente !== 'ALL') {
      const clientId = Number(filterCliente);
      if (trip.destination?.clientId !== clientId) {
        return false;
      }
    }

    // Filtro per Mese (la data è stringa es. "05/08/2026")
    if (filterMese !== 'ALL') {
      const parts = trip.date.split('/');
      if (parts.length === 3) {
        const monthYear = `${parts[1]}/${parts[2]}`; // es. "08/2026"
        if (monthYear !== filterMese) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  });

  // Estrae tutti i mesi/anni unici disponibili per il filtro
  const uniqueMonths = Array.from(
    new Set(
      trips
        .map((t) => {
          const parts = t.date.split('/');
          return parts.length === 3 ? `${parts[1]}/${parts[2]}` : null;
        })
        .filter((x): x is string => !!x)
    )
  ).sort();

  // Converti mese in stringa leggibile (es: "08/2026" -> "Agosto 2026")
  const getMonthName = (monthYearStr: string) => {
    const [m, y] = monthYearStr.split('/');
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  // Calcoli dei totali basati sul filtro corrente
  const totalTrips = filteredTrips.length;
  const totalWeight = filteredTrips.reduce((sum, t) => sum + (t.weight || 0), 0);
  const totalTransport = filteredTrips.reduce((sum, t) => sum + (t.transportPrice || 0) + (t.fuoriRomaPrice || 0), 0);
  const totalDisposal = filteredTrips.reduce((sum, t) => sum + (t.disposalPrice || 0), 0);
  const totalAccessories = filteredTrips.reduce(
    (sum, t) =>
      sum +
      (t.noleggioPrice || 0) +
      (t.bigBagPrice || 0) +
      (t.analisiPrice || 0) +
      (t.servRagnoPrice || 0) +
      (t.sostaPrice || 0),
    0
  );
  const totalTaxable = totalTransport + totalDisposal + totalAccessories;
  const totalIva = totalTaxable * 0.22;
  const totalIvato = totalTaxable * 1.22;

  // ----------------- AZIONI MUTATIVE (CRUD) -----------------

  // Funzione helper per resettare il form viaggio
  const resetTripForm = () => {
    setNewTripData({
      date: '', firNumber: '', wasteTypeId: '', weight: '', cerPrice: '',
      transportPrice: '', disposalPrice: '', fuoriRomaPrice: '0', noleggioPrice: '0',
      bigBagPrice: '0', analisiPrice: '0', servRagnoPrice: '0', sostaPrice: '0',
      address: '', notes: '', destinationId: '', driverId: '', vehicleId: '',
    });
    setSelectedTripClientId('');
    setPriceSource({ cerPrice: '', transportPrice: '', disposalPrice: '' });
    setPendingListinoSave(null);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createTrip(newTripData);
    if (res.success) {
      // Verifica se ci sono prezzi modificati manualmente da proporre per il listino
      const destination = destinations.find(d => d.id === Number(newTripData.destinationId));
      const clientId = destination ? destination.clientId : null;
      const wasteType = wasteTypes.find(w => w.id === Number(newTripData.wasteTypeId));
      const vehicle = vehicles.find(v => v.id === Number(newTripData.vehicleId));
      const client = clients.find(c => c.id === clientId);

      const pendingSave: typeof pendingListinoSave = {};
      let hasPending = false;

      // Proponi aggiornamento listino CER se modificato manualmente
      if (priceSource.cerPrice === 'manual' && newTripData.wasteTypeId && newTripData.cerPrice) {
        pendingSave.cerPrice = {
          wasteTypeId: Number(newTripData.wasteTypeId),
          clientId: clientId,
          pricePerQuintal: Number(newTripData.cerPrice) / 10, // cerPrice è €/t, pricePerQuintal è €/q
          cerCode: wasteType?.cerCode || '',
          clientName: client?.name || 'Listino Base',
        };
        hasPending = true;
      }

      // Proponi aggiornamento listino Trasporto se modificato manualmente
      if (priceSource.transportPrice === 'manual' && newTripData.vehicleId && newTripData.transportPrice) {
        pendingSave.transportPrice = {
          vehicleId: Number(newTripData.vehicleId),
          clientId: clientId,
          price: Number(newTripData.transportPrice),
          plateNumber: vehicle?.plateNumber || '',
          clientName: client?.name || 'Listino Base',
        };
        hasPending = true;
      }

      if (hasPending) {
        // Chiudi il form viaggio e apri il dialogo di conferma listino
        setIsTripModalOpen(false);
        setPendingListinoSave(pendingSave);
        setIsListinoConfirmOpen(true);
        await refreshData();
      } else {
        setIsTripModalOpen(false);
        resetTripForm();
        await refreshData();
      }
    } else {
      alert(res.error);
    }
  };

  const handleSaveToListino = async (saveDisposal: boolean, saveTransport: boolean) => {
    setIsListinoConfirmOpen(false);
    if (saveDisposal && pendingListinoSave?.cerPrice) {
      const d = pendingListinoSave.cerPrice;
      const res = await upsertDisposalPrice({ clientId: d.clientId, wasteTypeId: d.wasteTypeId, pricePerQuintal: d.pricePerQuintal });
      if (!res.success) alert('Errore aggiornamento listino smaltimento: ' + res.error);
    }
    if (saveTransport && pendingListinoSave?.transportPrice) {
      const t = pendingListinoSave.transportPrice;
      const res = await upsertTransportPrice({ clientId: t.clientId, vehicleId: t.vehicleId, price: t.price });
      if (!res.success) alert('Errore aggiornamento listino trasporto: ' + res.error);
    }
    resetTripForm();
    if (saveDisposal || saveTransport) await refreshData();
  };



  const handleDeleteTrip = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa riga di viaggio?')) {
      const res = await deleteTrip(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleData.driverId || !newScheduleData.vehicleId || !newScheduleData.startDate || !newScheduleData.endDate) {
      alert('Tutti i campi sono obbligatori.');
      return;
    }
    let res;
    if (newScheduleData.id) {
      res = await updateSchedule(newScheduleData.id, {
        date: newScheduleData.startDate.split('T')[0],
        startDate: newScheduleData.startDate,
        endDate: newScheduleData.endDate,
        driverId: Number(newScheduleData.driverId),
        vehicleId: Number(newScheduleData.vehicleId),
        notes: newScheduleData.notes,
      });
    } else {
      res = await createSchedule({
        date: newScheduleData.startDate.split('T')[0],
        startDate: newScheduleData.startDate,
        endDate: newScheduleData.endDate,
        driverId: Number(newScheduleData.driverId),
        vehicleId: Number(newScheduleData.vehicleId),
        notes: newScheduleData.notes,
      });
    }

    if (res.success) {
      setIsScheduleModalOpen(false);
      setNewScheduleData({
        driverId: '',
        vehicleId: '',
        startDate: '',
        endDate: '',
        notes: '',
      });
      await refreshSchedules(newScheduleData.startDate.split('T')[0]);
    } else {
      alert(res.error);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questo viaggio pianificato?')) {
      const res = await deleteSchedule(id);
      if (res.success) {
        await refreshSchedules(selectedDate);
      } else {
        alert(res.error);
      }
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createClient(newClientData);
    if (res.success) {
      setIsClientModalOpen(false);
      setNewClientData({ name: '', billingAddress: '', vatNumber: '', clientCode: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm('Rimuovendo il cliente verranno cancellati anche tutti i viaggi e le destinazioni ad esso associati. Continuare?')) {
      const res = await deleteClient(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createDestination({
      ...newDestinationData,
      clientId: Number(newDestinationData.clientId)
    });
    if (res.success) {
      setIsDestinationModalOpen(false);
      setNewDestinationData({ name: '', address: '', shippingCode: '', clientId: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDestination = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere questa destinazione? I viaggi associati verranno cancellati.')) {
      const res = await deleteDestination(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateDisposalPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisposalPriceData.wasteTypeId) {
      alert('Seleziona un codice CER.');
      return;
    }
    const res = await createDisposalPrice({
      clientId: newDisposalPriceData.clientId || null,
      wasteTypeId: Number(newDisposalPriceData.wasteTypeId),
      pricePerQuintal: Number(newDisposalPriceData.pricePerQuintal || 0),
    });
    if (res.success) {
      setNewDisposalPriceData({ clientId: '', wasteTypeId: '', pricePerQuintal: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDisposalPrice = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa voce di listino?')) {
      const res = await deleteDisposalPrice(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateTransportPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransportPriceData.vehicleId) {
      alert('Seleziona un veicolo.');
      return;
    }
    const res = await createTransportPrice({
      clientId: newTransportPriceData.clientId || null,
      vehicleId: Number(newTransportPriceData.vehicleId),
      price: Number(newTransportPriceData.price || 0),
    });
    if (res.success) {
      setNewTransportPriceData({ clientId: '', vehicleId: '', price: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteTransportPrice = async (id: number) => {
    if (confirm('Confermi di voler rimuovere questa voce di listino?')) {
      const res = await deleteTransportPrice(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const calculatePrefilledPrices = (destId: string, cerId: string, vehId: string, wt: string) => {
    let cerPrice = '';
    let transportPrice = '';
    let disposalPrice = '';
    let cerSource: 'client-list' | 'base-list' | '' = '';
    let transportSource: 'client-list' | 'base-list' | '' = '';
    let disposalSource: 'client-list' | 'base-list' | '' = '';

    const destination = destinations.find(d => d.id === Number(destId));
    const clientId = destination ? destination.clientId : null;

    if (cerId) {
      // Prima cerca il listino specifico per cliente
      let dispPrice = disposalPrices.find(dp => dp.clientId === clientId && dp.wasteTypeId === Number(cerId));
      if (dispPrice) {
        cerSource = 'client-list';
        disposalSource = 'client-list';
      } else {
        // Fallback al listino base
        dispPrice = disposalPrices.find(dp => dp.clientId === null && dp.wasteTypeId === Number(cerId));
        if (dispPrice) {
          cerSource = 'base-list';
          disposalSource = 'base-list';
        }
      }
      if (dispPrice) {
        const rate = dispPrice.pricePerQuintal;
        cerPrice = String(rate * 10);
        if (wt) {
          disposalPrice = String(Number(wt) * 10 * rate);
        }
      }
    }

    if (vehId) {
      // Prima cerca il listino specifico per cliente
      let transPrice = transportPrices.find(tp => tp.clientId === clientId && tp.vehicleId === Number(vehId));
      if (transPrice) {
        transportSource = 'client-list';
      } else {
        // Fallback al listino base
        transPrice = transportPrices.find(tp => tp.clientId === null && tp.vehicleId === Number(vehId));
        if (transPrice) {
          transportSource = 'base-list';
        }
      }
      if (transPrice) {
        transportPrice = String(transPrice.price);
      }
    }

    return { cerPrice, transportPrice, disposalPrice, cerSource, transportSource, disposalSource };
  };

  const handleTripDestinationChange = (destId: string) => {
    const calculated = calculatePrefilledPrices(destId, newTripData.wasteTypeId, newTripData.vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      destinationId: destId,
      cerPrice: calculated.cerPrice !== '' ? calculated.cerPrice : prev.cerPrice,
      transportPrice: calculated.transportPrice !== '' ? calculated.transportPrice : prev.transportPrice,
      disposalPrice: calculated.disposalPrice !== '' ? calculated.disposalPrice : prev.disposalPrice
    }));
    setPriceSource(prev => ({
      cerPrice: calculated.cerSource !== '' ? calculated.cerSource : prev.cerPrice,
      transportPrice: calculated.transportSource !== '' ? calculated.transportSource : prev.transportPrice,
      disposalPrice: calculated.disposalSource !== '' ? calculated.disposalSource : prev.disposalPrice,
    }));
  };

  const handleTripWasteTypeChange = (wasteTypeId: string) => {
    const calculated = calculatePrefilledPrices(newTripData.destinationId, wasteTypeId, newTripData.vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      wasteTypeId: wasteTypeId,
      cerPrice: calculated.cerPrice !== '' ? calculated.cerPrice : prev.cerPrice,
      disposalPrice: calculated.disposalPrice !== '' ? calculated.disposalPrice : prev.disposalPrice
    }));
    setPriceSource(prev => ({
      ...prev,
      cerPrice: calculated.cerSource !== '' ? calculated.cerSource : prev.cerPrice,
      disposalPrice: calculated.disposalSource !== '' ? calculated.disposalSource : prev.disposalPrice,
    }));
  };

  const handleTripVehicleChange = (vehicleId: string) => {
    const calculated = calculatePrefilledPrices(newTripData.destinationId, newTripData.wasteTypeId, vehicleId, newTripData.weight);
    setNewTripData(prev => ({
      ...prev,
      vehicleId: vehicleId,
      transportPrice: calculated.transportPrice !== '' ? calculated.transportPrice : prev.transportPrice
    }));
    setPriceSource(prev => ({
      ...prev,
      transportPrice: calculated.transportSource !== '' ? calculated.transportSource : prev.transportPrice,
    }));
  };

  const handleTripWeightChange = (wt: string) => {
    const wtVal = Number(wt || 0);
    const cerPriceVal = Number(newTripData.cerPrice || 0);
    const calculatedDispPrice = wtVal * cerPriceVal;
    setNewTripData(prev => ({
      ...prev,
      weight: wt,
      disposalPrice: wt ? String(calculatedDispPrice) : ''
    }));
  };

  const handleTripCerPriceChange = (cp: string) => {
    const wtVal = Number(newTripData.weight || 0);
    const cpVal = Number(cp || 0);
    const calculatedDispPrice = wtVal * cpVal;
    setNewTripData(prev => ({
      ...prev,
      cerPrice: cp,
      disposalPrice: prev.weight ? String(calculatedDispPrice) : ''
    }));
    // Marca come manuale se l'utente sta scrivendo
    setPriceSource(prev => ({ ...prev, cerPrice: 'manual', disposalPrice: 'manual' }));
  };

  const handleTripTransportPriceChange = (tp: string) => {
    setNewTripData(prev => ({ ...prev, transportPrice: tp }));
    setPriceSource(prev => ({ ...prev, transportPrice: 'manual' }));
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createDriver(newDriverData);
    if (res.success) {
      setIsDriverModalOpen(false);
      setNewDriverData({ name: '', email: '', phone: '', licenseNumber: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteDriver = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere l\'autista?')) {
      const res = await deleteDriver(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createVehicle(newVehicleData);
    if (res.success) {
      setIsVehicleModalOpen(false);
      setNewVehicleData({ plateNumber: '', model: '', capacity: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere il veicolo?')) {
      const res = await deleteVehicle(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createWasteType(newWasteData);
    if (res.success) {
      setIsWasteModalOpen(false);
      setNewWasteData({ cerCode: '', description: '' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteWaste = async (id: number) => {
    if (confirm('Sicuro di voler rimuovere questo codice CER?')) {
      const res = await deleteWasteType(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createUser(newUserData);
    if (res.success) {
      setIsUserModalOpen(false);
      setNewUserData({ email: '', name: '', password: '', role: 'OPERATOR' });
      await refreshData();
    } else {
      alert(res.error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (currentUser?.id === id) {
      alert('Non puoi cancellare l\'utente corrente loggato!');
      return;
    }
    if (confirm('Sicuro di voler eliminare questo utente?')) {
      const res = await deleteUser(id);
      if (res.success) await refreshData();
      else alert(res.error);
    }
  };

  // ----------------- VISTA LOGIN -----------------

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg inline-block shadow mb-3">
              <img src="/logo.png" alt="Breci Trasporti Logo" className="h-16 object-contain" />
            </div>
            <p className="text-zinc-400 mt-2">Logistica Rifiuti & Formulari (FIR)</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {loginError && (
              <div className="p-3 bg-red-950/30 border border-red-900 rounded-lg text-red-400 text-sm">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-zinc-300">Email o Utente</label>
              <input
                type="email"
                name="email"
                required
                className="w-full mt-2 p-3 bg-zinc-850 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="nome@brecitrasporti.it"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-300">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full mt-2 p-3 bg-zinc-850 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg font-bold text-white transition-colors cursor-pointer"
            >
              Accedi
            </button>
          </form>

          <div className="mt-8 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
            <p className="font-semibold text-zinc-400 mb-2">Credenziali Demo di Prova:</p>
            <p>Admin: <code className="text-zinc-300">admin@brecitrasporti.it</code> / <code className="text-zinc-300">admin</code></p>
            <p className="mt-1">Operator: <code className="text-zinc-300">operator@brecitrasporti.it</code> / <code className="text-zinc-300">operator</code></p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------- VISTA PRINCIPALE -----------------

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Hamburger (Lasagna) button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-zinc-800 active:bg-zinc-700 rounded-lg focus:outline-none cursor-pointer"
            title="Menu di navigazione"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded inline-block shadow">
              <img src="/logo.png" alt="Breci Logo" className="h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Breci Trasporti</h1>
              <p className="text-[10px] text-zinc-400 hidden sm:block">Gestione Logistica Rifiuti</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-zinc-400 capitalize">{currentUser.role.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-red-700/80 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Esci
          </button>
        </div>
      </header>

      {/* Lasagna Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex" onClick={() => setIsMenuOpen(false)}>
          <div
            className="w-72 bg-zinc-900 border-r border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <span className="font-bold text-lg text-white">Menu Funzionalità</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => { setActiveTab('registro'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'registro' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>🚚</span>
                  <span>Registro Giornaliero</span>
                </button>
                <button
                  onClick={() => { setActiveTab('pianificazione'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'pianificazione' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>📅</span>
                  <span>Pianificazione Turni</span>
                </button>
                <button
                  onClick={() => { setActiveTab('anagrafiche'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'anagrafiche' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>📁</span>
                  <span>Anagrafiche (Master)</span>
                </button>
                <button
                  onClick={() => { setActiveTab('listini'); setIsMenuOpen(false); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'listini' ? 'bg-emerald-700 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                >
                  <span>💰</span>
                  <span>Listini Prezzi</span>
                </button>
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => { setActiveTab('utenti'); setIsMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${activeTab === 'utenti' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-zinc-800 text-zinc-300'}`}
                  >
                    <span>👥</span>
                    <span>Gestione Utenti</span>
                  </button>
                )}
              </nav>
            </div>

            <div className="pt-4 border-t border-zinc-800 text-center">
              <p className="text-xs text-zinc-500 font-medium">Breci Trasporti s.r.l. © 2026</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        
        {loading && trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            <p className="mt-4 text-zinc-400">Caricamento dati...</p>
          </div>
        ) : (
          <>
            {/* TAB: REGISTRO GIORNALIERO */}
            {activeTab === 'registro' && (
              <div>
                {/* Header view */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Registro Viaggi Giornaliero</h2>
                    <p className="text-sm text-zinc-400">Modifica o visualizza le movimentazioni dei rifiuti.</p>
                  </div>
                  <button
                    onClick={() => setIsTripModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer self-start md:self-auto"
                  >
                    <span>+</span> Aggiungi Riga Viaggio
                  </button>
                </div>

                {/* Filters Row */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-center">
                  <div className="flex flex-col">
                    <label className="text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Filtra per Cliente</label>
                    <select
                      value={filterCliente}
                      onChange={(e) => setFilterCliente(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">Tutti i Clienti</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-zinc-400 font-semibold mb-1 uppercase tracking-wider">Filtra per Mese</label>
                    <select
                      value={filterMese}
                      onChange={(e) => setFilterMese(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ALL">Tutti i Mesi</option>
                      {uniqueMonths.map((m) => (
                        <option key={m} value={m}>{getMonthName(m)}</option>
                      ))}
                    </select>
                  </div>

                  {(filterCliente !== 'ALL' || filterMese !== 'ALL') && (
                    <button
                      onClick={() => { setFilterCliente('ALL'); setFilterMese('ALL'); }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold mt-4 sm:mt-0 cursor-pointer"
                    >
                      Resetta Filtri
                    </button>
                  )}
                </div>

                {/* KPI Cards (based on filters) */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Viaggi Filtrati</p>
                    <p className="text-xl font-bold mt-2 text-white">{totalTrips}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Peso (t)</p>
                    <p className="text-xl font-bold mt-2 text-white">{formatWeight(totalWeight)} t</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trasporti</p>
                    <p className="text-xl font-bold mt-2 text-blue-400">{formatCurrency(totalTransport)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Smaltimenti</p>
                    <p className="text-xl font-bold mt-2 text-amber-400">{formatCurrency(totalDisposal)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Imponibile</p>
                    <p className="text-xl font-bold mt-2 text-zinc-300">{formatCurrency(totalTaxable)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">IVA (22%)</p>
                    <p className="text-xl font-bold mt-2 text-indigo-400">{formatCurrency(totalIva)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm text-emerald-400 border-emerald-950 bg-emerald-950/5">
                    <p className="text-xs font-bold uppercase tracking-wider">Tot. Ivato</p>
                    <p className="text-xl font-extrabold mt-2">{formatCurrency(totalIvato)}</p>
                  </div>
                </section>

                {/* Table Container */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                          <th className="p-3">Data</th>
                          <th className="p-3">N. FIR</th>
                          <th className="p-3">CER</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Destinazione</th>
                          <th className="p-3 text-right">Peso (t)</th>
                          <th className="p-3">Mezzo</th>
                          <th className="p-3">Autista</th>
                          <th className="p-3 text-right">Trasporto</th>
                          <th className="p-3 text-right">Smaltimento</th>
                          <th className="p-3 text-right">Accessori</th>
                          <th className="p-3 text-right font-bold text-zinc-350">Imponibile</th>
                          <th className="p-3 text-right font-bold text-indigo-400">IVA (22%)</th>
                          <th className="p-3 text-right font-bold text-emerald-400">Totale Ivato</th>
                          <th className="p-3 text-center">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-sm">
                        {filteredTrips.length === 0 ? (
                          <tr>
                            <td colSpan={15} className="p-8 text-center text-zinc-500">Nessun viaggio trovato con i filtri selezionati.</td>
                          </tr>
                        ) : (
                          filteredTrips.map((trip) => {
                            const rowTransport = (trip.transportPrice || 0) + (trip.fuoriRomaPrice || 0);
                            const rowDisposal = trip.disposalPrice || 0;
                            const rowAccessories =
                              (trip.noleggioPrice || 0) +
                              (trip.bigBagPrice || 0) +
                              (trip.analisiPrice || 0) +
                              (trip.servRagnoPrice || 0) +
                              (trip.sostaPrice || 0);
                            const rowTaxable = rowTransport + rowDisposal + rowAccessories;
                            const rowIva = rowTaxable * 0.22;
                            const rowTotal = rowTaxable * 1.22;

                            return (
                              <tr key={trip.id} className="hover:bg-zinc-800/40 transition-colors">
                                <td className="p-3 whitespace-nowrap font-medium">{trip.date}</td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded border border-zinc-700 text-zinc-300">
                                    {trip.firNumber}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className="inline-flex items-center rounded-md bg-zinc-850 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 border border-zinc-700">
                                    {trip.cerCode}
                                  </span>
                                </td>
                                <td className="p-3 truncate max-w-[150px]" title={trip.destination?.client?.name || ''}>
                                  {trip.destination?.client?.name || '-'}
                                </td>
                                <td className="p-3 truncate max-w-[150px]" title={trip.destination?.name || ''}>
                                  {trip.destination?.name || '-'}
                                </td>
                                <td className="p-3 text-right font-semibold">{formatWeight(trip.weight)}</td>
                                <td className="p-3">
                                  <span className="font-mono font-bold text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-800">
                                    {trip.vehicle?.plateNumber || "-"}
                                  </span>
                                </td>
                                <td className="p-3 truncate max-w-[100px]" title={trip.driver?.name || ''}>
                                  {trip.driver?.name || "-"}
                                </td>
                                <td className="p-3 text-right">{formatCurrency(rowTransport)}</td>
                                <td className="p-3 text-right">{formatCurrency(rowDisposal)}</td>
                                <td className="p-3 text-right text-zinc-500">
                                  {rowAccessories > 0 ? formatCurrency(rowAccessories) : "-"}
                                </td>
                                <td className="p-3 text-right font-bold text-zinc-300">
                                  {formatCurrency(rowTaxable)}
                                </td>
                                <td className="p-3 text-right text-indigo-400">
                                  {formatCurrency(rowIva)}
                                </td>
                                <td className="p-3 text-right font-bold text-emerald-400">
                                  {formatCurrency(rowTotal)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteTrip(trip.id)}
                                    className="p-1 hover:bg-zinc-800 hover:text-red-400 text-zinc-500 rounded transition-colors cursor-pointer"
                                    title="Cancella riga"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-zinc-800/30 font-bold border-t border-zinc-800">
                          <td className="p-3" colSpan={5}>Totale Selezionato</td>
                          <td className="p-3 text-right">{formatWeight(totalWeight)} t</td>
                          <td className="p-3" colSpan={2}></td>
                          <td className="p-3 text-right text-blue-400">{formatCurrency(totalTransport)}</td>
                          <td className="p-3 text-right text-amber-400">{formatCurrency(totalDisposal)}</td>
                          <td className="p-3 text-right text-zinc-400">{formatCurrency(totalAccessories)}</td>
                          <td className="p-3 text-right text-zinc-350">{formatCurrency(totalTaxable)}</td>
                          <td className="p-3 text-right text-indigo-400">{formatCurrency(totalIva)}</td>
                          <td className="p-3 text-right text-emerald-400">{formatCurrency(totalIvato)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PIANIFICAZIONE */}
            {activeTab === 'pianificazione' && (() => {
              // Array di ore fisse (es: 06:00 - 22:00)
              const START_HOUR = 5;
              const END_HOUR = 23;
              const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

              // View settings
              const isWeekView = calendarView === 'week';
              
              // Calcolo giorni da mostrare
              const start = new Date(currentCalendarDate);
              const viewDaysCount = isWeekView ? 7 : 1;
              const weekDays = Array.from({ length: viewDaysCount }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return d;
              });

              // Nomi giorni e mesi
              const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
              const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
              
              const weekLabel = isWeekView
                ? `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${monthNames[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
                : `${weekDays[0].getDate()} ${monthNames[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()} (${dayNames[weekDays[0].getDay()]})`;

              // Helpers per navigazione
              const goToPrev = () => {
                const d = new Date(currentCalendarDate);
                d.setDate(d.getDate() - (isWeekView ? 7 : 1));
                setCurrentCalendarDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
              };
              const goToNext = () => {
                const d = new Date(currentCalendarDate);
                d.setDate(d.getDate() + (isWeekView ? 7 : 1));
                setCurrentCalendarDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
              };
              const goToToday = () => {
                const today = new Date();
                if (isWeekView) {
                  const day = today.getDay();
                  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(today.setDate(diff));
                  setCurrentCalendarDate(`${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`);
                } else {
                  setCurrentCalendarDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                }
              };

              // Palette colori autisti
              const driverColors = [
                'bg-indigo-600 border-indigo-400',
                'bg-emerald-600 border-emerald-400',
                'bg-rose-600 border-rose-400',
                'bg-amber-600 border-amber-400',
                'bg-cyan-600 border-cyan-400',
                'bg-purple-600 border-purple-400',
                'bg-pink-600 border-pink-400',
                'bg-blue-600 border-blue-400',
                'bg-teal-600 border-teal-400',
                'bg-fuchsia-600 border-fuchsia-400'
              ];
              const getDriverColorClass = (driverId: number | undefined) => {
                if (!driverId) return 'bg-zinc-600 border-zinc-400';
                return driverColors[driverId % driverColors.length];
              };

              // Helper per calcolare lo stile del blocco evento
              const getEventStyle = (startDateStr: string, endDateStr: string, overlapCol = 0, overlapCount = 1) => {
                const s = new Date(startDateStr);
                const e = new Date(endDateStr);
                
                const sDecimal = s.getHours() + s.getMinutes() / 60;
                let eDecimal = e.getHours() + e.getMinutes() / 60;
                
                if (e.getDate() !== s.getDate() || eDecimal < sDecimal) {
                  eDecimal = 24; 
                }

                const startOffset = Math.max(0, sDecimal - START_HOUR);
                const duration = Math.max(0.5, eDecimal - Math.max(sDecimal, START_HOUR)); 

                const HOUR_HEIGHT = 48;
                const widthPerc = 100 / overlapCount;
                const leftPerc = overlapCol * widthPerc;

                return {
                  top: `${startOffset * HOUR_HEIGHT}px`,
                  height: `${duration * HOUR_HEIGHT}px`,
                  position: 'absolute' as const,
                  left: `calc(${leftPerc}% + 2px)`,
                  width: `calc(${widthPerc}% - 4px)`,
                  zIndex: 10 + overlapCol
                };
              };

              return (
                <div className="flex flex-col h-[calc(100vh-100px)]">
                  {/* HEADER DEL CALENDARIO */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <button onClick={goToToday} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold rounded-lg transition-colors border border-zinc-700 cursor-pointer">
                        Oggi
                      </button>
                      <div className="flex items-center rounded-lg border border-zinc-700 overflow-hidden">
                        <button onClick={goToPrev} className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={goToNext} className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors border-l border-zinc-700 cursor-pointer text-zinc-400 hover:text-white">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                      <h2 className="text-lg font-bold text-white ml-2 capitalize">{weekLabel}</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <select 
                        value={calendarView}
                        onChange={(e) => {
                          const newView = e.target.value as 'week' | 'day';
                          setCalendarView(newView);
                          if (newView === 'week') {
                            const d = new Date(currentCalendarDate);
                            const day = d.getDay();
                            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                            const monday = new Date(d.setDate(diff));
                            setCurrentCalendarDate(`${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`);
                          }
                        }}
                        className="bg-zinc-800 border border-zinc-700 text-sm font-semibold rounded-lg px-3 py-1.5 text-white outline-none cursor-pointer"
                      >
                        <option value="week">Settimana</option>
                        <option value="day">Giorno</option>
                      </select>
                      <button
                        onClick={() => {
                          const target = new Date(currentCalendarDate);
                          if (isWeekView) target.setDate(target.getDate() + 1); // just a fallback
                          const yyyy = target.getFullYear();
                          const mm = String(target.getMonth() + 1).padStart(2, '0');
                          const dd = String(target.getDate()).padStart(2, '0');
                          setNewScheduleData({
                            driverId: '',
                            vehicleId: '',
                            startDate: `${yyyy}-${mm}-${dd}T08:00`,
                            endDate: `${yyyy}-${mm}-${dd}T17:00`,
                            notes: '',
                          });
                          setIsScheduleModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span className="text-lg leading-none mb-0.5">+</span> Pianifica
                      </button>
                    </div>
                  </div>

                  {/* GRIGLIA CALENDARIO */}
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-lg">
                    {/* Intestazioni Giorni */}
                    <div className="flex border-b border-zinc-800 bg-zinc-800/50">
                      <div className="w-16 flex-shrink-0 border-r border-zinc-800"></div>
                      {weekDays.map((d, i) => {
                        const isToday = new Date().toDateString() === d.toDateString();
                        return (
                          <div key={i} className={`flex-1 py-3 text-center border-r border-zinc-800/50 last:border-r-0 ${isToday ? 'bg-blue-900/20' : ''}`}>
                            <div className="flex flex-col items-center justify-center">
                              <span className={`text-2xl font-light ${isToday ? 'text-blue-400 font-bold' : 'text-zinc-300'}`}>
                                {String(d.getDate()).padStart(2, '0')}
                              </span>
                              <span className={`text-xs uppercase font-semibold ${isToday ? 'text-blue-400' : 'text-zinc-500'}`}>
                                {dayNames[d.getDay()]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Corpo Griglia (Scrollabile) */}
                    <div className="flex-1 overflow-y-auto relative bg-[#121212]">
                      <div className="flex min-h-max">
                        {/* Colonna Orari */}
                        <div className="w-16 flex-shrink-0 border-r border-zinc-800 relative bg-zinc-900/50">
                          {hours.map((h, i) => (
                            <div key={i} className="h-12 border-b border-zinc-800/50 relative">
                              <span className="absolute -top-3 right-2 text-xs font-semibold text-zinc-500">
                                {String(h).padStart(2, '0')}:00
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Colonne Giorni e Eventi */}
                        {weekDays.map((d, i) => {
                          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                          // Filtra i turni per questo giorno
                          const daySchedulesRaw = schedules.filter(s => s.startDate.startsWith(dateStr) || s.date === dateStr);
                          const isToday = new Date().toDateString() === d.toDateString();

                          // --- Algoritmo Sovrapposizioni (Overlaps) ---
                          const sortedSchedules = [...daySchedulesRaw].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                          const layout = new Map<number, { col: number, count: number }>();
                          const groups: (typeof sortedSchedules)[] = [];
                          let lastGroupEnd = 0;
                          let currentGroup: typeof sortedSchedules = [];
                          
                          sortedSchedules.forEach(s => {
                            const start = new Date(s.startDate).getTime();
                            const end = new Date(s.endDate).getTime();
                            if (start >= lastGroupEnd) {
                              if (currentGroup.length > 0) groups.push(currentGroup);
                              currentGroup = [s];
                              lastGroupEnd = end;
                            } else {
                              currentGroup.push(s);
                              lastGroupEnd = Math.max(lastGroupEnd, end);
                            }
                          });
                          if (currentGroup.length > 0) groups.push(currentGroup);
                          
                          groups.forEach(group => {
                            const colsEndTimes: number[] = [];
                            group.forEach(s => {
                              const start = new Date(s.startDate).getTime();
                              const end = new Date(s.endDate).getTime();
                              let placedCol = -1;
                              for (let i = 0; i < colsEndTimes.length; i++) {
                                if (start >= colsEndTimes[i]) {
                                  colsEndTimes[i] = end;
                                  placedCol = i;
                                  break;
                                }
                              }
                              if (placedCol === -1) {
                                colsEndTimes.push(end);
                                placedCol = colsEndTimes.length - 1;
                              }
                              layout.set(s.id, { col: placedCol, count: 0 });
                            });
                            const maxCols = colsEndTimes.length;
                            group.forEach(s => {
                              layout.get(s.id)!.count = maxCols;
                            });
                          });
                          const daySchedules = sortedSchedules;
                          // ------------------------------------------

                          return (
                            <div 
                              key={i} 
                              className={`flex-1 relative border-r border-zinc-800/50 last:border-r-0 ${isToday ? 'bg-blue-900/5' : ''}`}
                              onClick={(e) => {
                                // Se l'utente clicca sulla griglia vuota, apre il modale
                                if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('hour-slot')) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const y = e.clientY - rect.top;
                                  const HOUR_HEIGHT = 48;
                                  const clickedHour = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                                  
                                  const hStr = String(Math.min(23, clickedHour)).padStart(2, '0');
                                  const endHStr = String(Math.min(23, clickedHour + 1)).padStart(2, '0');
                                  
                                  setNewScheduleData({
                                    driverId: '',
                                    vehicleId: '',
                                    startDate: `${dateStr}T${hStr}:00`,
                                    endDate: `${dateStr}T${endHStr}:00`,
                                    notes: '',
                                  });
                                  setIsScheduleModalOpen(true);
                                }
                              }}
                            >
                              {/* Linee Orizzontali Griglia */}
                              {hours.map((_, idx) => (
                                <div key={idx} className="h-12 border-b border-zinc-800/50 pointer-events-none hour-slot"></div>
                              ))}

                              {/* Eventi */}
                              {daySchedules.map(s => {
                                const layoutInfo = layout.get(s.id) || { col: 0, count: 1 };
                                const style = getEventStyle(s.startDate, s.endDate, layoutInfo.col, layoutInfo.count);
                                const colorClass = getDriverColorClass(s.driverId);
                                
                                return (
                                  <div
                                    key={s.id}
                                    style={style}
                                    className={`${colorClass} opacity-95 hover:opacity-100 border rounded-md p-1.5 overflow-visible text-xs text-white cursor-pointer transition-opacity shadow-sm group flex flex-col gap-0.5`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewScheduleData({
                                        id: s.id,
                                        driverId: s.driverId.toString(),
                                        vehicleId: s.vehicleId.toString(),
                                        startDate: s.startDate,
                                        endDate: s.endDate,
                                        notes: s.notes || ''
                                      });
                                      setIsScheduleModalOpen(true);
                                    }}
                                  >
                                    <div className="font-bold truncate">{s.driver?.name || 'Sconosciuto'}</div>
                                    <div className="font-mono text-[10px] text-white/80 truncate">{s.vehicle?.plateNumber} - {s.vehicle?.model}</div>
                                    {s.notes && (
                                      <div className="text-[10px] italic text-white/70 mt-0.5 truncate">
                                        {s.notes}
                                      </div>
                                    )}

                                    {/* Tooltip Hover */}
                                    <div className="hidden group-hover:flex flex-col gap-1 absolute top-0 left-[calc(100%+4px)] min-w-[200px] p-3 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-lg z-[9999] pointer-events-none text-left font-sans">
                                      <div className="font-bold text-white border-b border-zinc-700 pb-1 mb-1">Dettagli Turno</div>
                                      <div><span className="text-zinc-400 font-semibold">Autista:</span> {s.driver?.name}</div>
                                      <div><span className="text-zinc-400 font-semibold">Mezzo:</span> {s.vehicle?.plateNumber}</div>
                                      <div><span className="text-zinc-400 font-semibold">Inizio:</span> {new Date(s.startDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</div>
                                      <div><span className="text-zinc-400 font-semibold">Fine:</span> {new Date(s.endDate).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</div>
                                      {s.notes && <div className="mt-1 pt-1 border-t border-zinc-700/50"><span className="text-zinc-400 font-semibold">Note:</span> {s.notes}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB: ANAGRAFICHE */}
            {activeTab === 'anagrafiche' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Anagrafiche Aziendali & Risorse</h2>
                  <p className="text-sm text-zinc-400">Gestisci i soggetti, gli autisti, i mezzi e i codici CER dei rifiuti.</p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex border-b border-zinc-800 mb-6 gap-2 flex-wrap">
                  <button
                    onClick={() => setAnagraficaSubTab('clienti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'clienti' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    👥 Clienti
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('destinatari')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'destinatari' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    📍 Destinazioni (Cantieri)
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('autisti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'autisti' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    👤 Autisti
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('mezzi')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'mezzi' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🚛 Veicoli (Mezzi)
                  </button>
                  <button
                    onClick={() => setAnagraficaSubTab('cer')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${anagraficaSubTab === 'cer' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🏷️ Codici CER
                  </button>
                </div>

                {/* SUB TAB: CLIENTI */}
                {anagraficaSubTab === 'clienti' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Clienti</h3>
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Cliente
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Codice Cliente</th>
                            <th className="p-3">Ragione Sociale</th>
                            <th className="p-3">Indirizzo Fatturazione</th>
                            <th className="p-3">Cod. Fiscale / P.IVA</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {clients.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-blue-400">{c.clientCode}</td>
                              <td className="p-3 font-semibold text-white">{c.name}</td>
                              <td className="p-3 text-zinc-300">{c.billingAddress || '-'}</td>
                              <td className="p-3 font-mono text-zinc-400">{c.vatNumber || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteClient(c.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: DESTINATARI */}
                {anagraficaSubTab === 'destinatari' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Destinazioni (Cantieri di Spedizione)</h3>
                      <button
                        onClick={() => setIsDestinationModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Destinazione
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Codice Spedizione</th>
                            <th className="p-3">Nome Cantiere / Indirizzo</th>
                            <th className="p-3">Indirizzo di Spedizione</th>
                            <th className="p-3">Cliente Collegato (Fatturazione)</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {destinations.map((d) => (
                            <tr key={d.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-amber-400">{d.shippingCode}</td>
                              <td className="p-3 font-semibold text-white">{d.name}</td>
                              <td className="p-3 text-zinc-300">{d.address}</td>
                              <td className="p-3 text-zinc-400">
                                {d.client?.name} ({d.client?.clientCode})
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteDestination(d.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: AUTISTI */}
                {anagraficaSubTab === 'autisti' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Autisti</h3>
                      <button
                        onClick={() => setIsDriverModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Autista
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Nome Autista</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Telefono</th>
                            <th className="p-3">N. Patente</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {drivers.map((d) => (
                            <tr key={d.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-semibold text-white">{d.name}</td>
                              <td className="p-3 text-zinc-300">{d.email}</td>
                              <td className="p-3 text-zinc-400">{d.phone || '-'}</td>
                              <td className="p-3 font-mono text-zinc-400">{d.licenseNumber || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteDriver(d.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: VEICOLI */}
                {anagraficaSubTab === 'mezzi' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Anagrafica Flotta Mezzi</h3>
                      <button
                        onClick={() => setIsVehicleModalOpen(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Aggiungi Veicolo
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Targa Veicolo</th>
                            <th className="p-3">Modello</th>
                            <th className="p-3 text-right">Portata Utile (kg)</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {vehicles.map((v) => (
                            <tr key={v.id} className="hover:bg-zinc-800/20">
                              <td className="p-3 font-mono font-bold text-blue-400">{v.plateNumber}</td>
                              <td className="p-3 text-zinc-300">{v.model || '-'}</td>
                              <td className="p-3 text-right font-semibold">{v.capacity ? `${formatWeight(v.capacity)} kg` : '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteVehicle(v.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB TAB: CER CODES */}
                {anagraficaSubTab === 'cer' && (() => {
                  const cerCategories = [
                    '01 - Rifiuti da estrazione e prospezione di miniere e cave',
                    '02 - Rifiuti da agricoltura, selvicoltura, caccia e pesca',
                    '03 - Rifiuti da lavorazione del legno, carta e cartone',
                    '04 - Rifiuti da industria tessile e conciaria',
                    '05 - Rifiuti da raffinazione del petrolio e trattamento carbone',
                    '06 - Rifiuti da processi chimici inorganici',
                    '07 - Rifiuti da processi chimici organici',
                    '08 - Rifiuti da produzione di vernici, pitture, inchiostri e adesivi',
                    '09 - Rifiuti dell\'industria fotografica',
                    '10 - Rifiuti provenienti da processi termici',
                    '11 - Rifiuti da trattamento chimico e rivestimento di metalli',
                    '12 - Rifiuti da lavorazione fisica e meccanica di metalli e plastica',
                    '13 - Oli esausti e residui di combustibili liquidi',
                    '14 - Solventi organici e refrigeranti esausti',
                    '15 - Imballaggi, assorbenti, stracci e materiali filtranti',
                    '16 - Rifiuti non specificati altrove nel catalogo',
                    '17 - Rifiuti da operazioni di costruzione e demolizione',
                    '18 - Rifiuti sanitari e veterinari o da attività di ricerca',
                    '19 - Rifiuti da impianti di trattamento rifiuti e acque reflue',
                    '20 - Rifiuti urbani e domestici della raccolta differenziata'
                  ];

                  const filtered = wasteTypes.filter((w) => {
                    const matchesSearch = 
                      (w.cerCode || '').toLowerCase().includes(cerSearchQuery.toLowerCase()) ||
                      (w.description || '').toLowerCase().includes(cerSearchQuery.toLowerCase());
                    const matchesCategory = cerCategoryFilter === '' || w.category === cerCategoryFilter;
                    return matchesSearch && matchesCategory;
                  });

                  const grouped = filtered.reduce((acc: { [key: string]: any[] }, w) => {
                    const cat = w.category || 'Altro';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(w);
                    return acc;
                  }, {});

                  const sortedKeys = Object.keys(grouped).sort((a, b) => {
                    if (a === 'Altro') return 1;
                    if (b === 'Altro') return -1;
                    return a.localeCompare(b);
                  });

                  return (
                    <div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">Anagrafica Codici EER/CER (Articoli)</h3>
                          <p className="text-xs text-zinc-400 mt-1">Totale codici trovati: {filtered.length} di {wasteTypes.length}</p>
                        </div>
                        <button
                          onClick={() => setIsWasteModalOpen(true)}
                          className="self-start md:self-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Aggiungi Codice CER
                        </button>
                      </div>

                      {/* FILTERS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Ricerca per Codice o Descrizione</label>
                          <input
                            type="text"
                            placeholder="Cerca es: 170107 o cemento..."
                            value={cerSearchQuery}
                            onChange={(e) => setCerSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Filtro Categoria (Capitolo)</label>
                          <select
                            value={cerCategoryFilter}
                            onChange={(e) => setCerCategoryFilter(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-700"
                          >
                            <option value="">Tutte le categorie</option>
                            {cerCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* TABLE WITH GROUPING */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
                        {sortedKeys.length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-sm">
                            Nessun codice CER corrisponde ai filtri impostati.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800 sticky top-0 z-10 backdrop-blur-md">
                                <th className="p-3 w-48">Codice CER</th>
                                <th className="p-3">Descrizione del Rifiuto</th>
                                <th className="p-3 text-center w-24">Rimuovi</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {sortedKeys.map((catKey) => (
                                <React.Fragment key={catKey}>
                                  {/* Category Header Row */}
                                  <tr className="bg-zinc-850/80 font-bold border-y border-zinc-800 text-xs text-emerald-400 select-none">
                                    <td colSpan={3} className="p-2.5 px-4 bg-zinc-800/20">
                                      📁 Categoria: {catKey}
                                    </td>
                                  </tr>
                                  {grouped[catKey].map((w) => (
                                    <tr key={w.id} className="hover:bg-zinc-800/20 border-b border-zinc-800/30">
                                      <td className="p-3 px-6 font-mono font-bold text-zinc-100">{w.cerCode}</td>
                                      <td className="p-3 text-zinc-300 truncate max-w-xl" title={w.description || ''}>
                                        {w.description || '-'}
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => handleDeleteWaste(w.id)}
                                          className="text-red-500 hover:text-red-400 p-1 px-2.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors text-xs font-semibold"
                                        >
                                          Elimina
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: LISTINI PREZZI */}
            {activeTab === 'listini' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">💰 Listini Prezzi</h2>
                  <p className="text-sm text-zinc-400 mt-1">Gestisci i prezzi per smaltimento (CER) e trasporto per cliente o come tariffe base.</p>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex border-b border-zinc-800 mb-6 gap-2">
                  <button
                    onClick={() => setListinoSubTab('smaltimento')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${listinoSubTab === 'smaltimento' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    ♻️ Listino Smaltimento (CER)
                  </button>
                  <button
                    onClick={() => setListinoSubTab('trasporti')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors cursor-pointer border-b-2 ${listinoSubTab === 'trasporti' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                  >
                    🚚 Listino Trasporti
                  </button>
                </div>

                {/* LISTINO SMALTIMENTO */}
                {listinoSubTab === 'smaltimento' && (
                  <div>
                    <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <h3 className="text-md font-bold text-white mb-1">Aggiungi / Modifica Voce Listino Smaltimento</h3>
                      <p className="text-xs text-zinc-500 mb-4">Il listino cliente ha priorità su quello base. Se la voce esiste già verrà aggiornata.</p>
                      <form onSubmit={handleCreateDisposalPrice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Cliente <span className="text-zinc-600">(vuoto = Prezzo Base)</span></label>
                          <select
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            value={newDisposalPriceData.clientId}
                            onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, clientId: e.target.value })}
                          >
                            <option value="">-- PREZZO BASE (Generale) --</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Codice CER</label>
                          <select
                            required
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            value={newDisposalPriceData.wasteTypeId}
                            onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, wasteTypeId: e.target.value })}
                          >
                            <option value="">Seleziona CER...</option>
                            {wasteTypes.map((w) => (
                              <option key={w.id} value={w.id}>{w.cerCode} - {w.description?.substring(0, 45)}...</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Prezzo al Quintale (€/q.le)</label>
                          <input
                            type="number"
                            step="0.001"
                            required
                            placeholder="Es: 1.70"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newDisposalPriceData.pricePerQuintal}
                            onChange={(e) => setNewDisposalPriceData({ ...newDisposalPriceData, pricePerQuintal: e.target.value })}
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
                          >
                            Salva nel Listino
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Priorità</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Codice CER</th>
                            <th className="p-3">Descrizione</th>
                            <th className="p-3 text-right">Prezzo al Quintale</th>
                            <th className="p-3 text-right">Prezzo al Tonnellata</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {disposalPrices
                            .slice()
                            .sort((a: any, b: any) => {
                              // Listino cliente prima, poi listino base
                              if (a.client && !b.client) return -1;
                              if (!a.client && b.client) return 1;
                              return 0;
                            })
                            .map((dp: any) => (
                            <tr key={dp.id} className="hover:bg-zinc-800/20">
                              <td className="p-3">
                                {dp.client ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/40">
                                    🔗 Cliente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                    📋 Base
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-zinc-200">
                                {dp.client ? (
                                  <span className="text-blue-400">{dp.client.name} ({dp.client.clientCode})</span>
                                ) : (
                                  <span className="text-zinc-500 font-bold italic">PREZZO BASE</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-400">{dp.wasteType?.cerCode}</td>
                              <td className="p-3 text-zinc-400 max-w-md truncate" title={dp.wasteType?.description || ''}>
                                {dp.wasteType?.description || '-'}
                              </td>
                              <td className="p-3 text-right text-zinc-100 font-mono">{formatCurrency(dp.pricePerQuintal)} /q.le</td>
                              <td className="p-3 text-right text-amber-400 font-mono">{formatCurrency(dp.pricePerQuintal * 10)} /t</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteDisposalPrice(dp.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                          {disposalPrices.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-zinc-500">Nessuna voce definita nel listino smaltimento.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* LISTINO TRASPORTI */}
                {listinoSubTab === 'trasporti' && (
                  <div>
                    <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <h3 className="text-md font-bold text-white mb-1">Aggiungi / Modifica Voce Listino Trasporto</h3>
                      <p className="text-xs text-zinc-500 mb-4">Il listino cliente ha priorità su quello base. Se la voce esiste già verrà aggiornata.</p>
                      <form onSubmit={handleCreateTransportPrice} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Cliente <span className="text-zinc-600">(vuoto = Prezzo Base)</span></label>
                          <select
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            value={newTransportPriceData.clientId}
                            onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, clientId: e.target.value })}
                          >
                            <option value="">-- PREZZO BASE (Generale) --</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Automezzo</label>
                          <select
                            required
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                            value={newTransportPriceData.vehicleId}
                            onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, vehicleId: e.target.value })}
                          >
                            <option value="">Seleziona Veicolo...</option>
                            {vehicles.map((v) => (
                              <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400">Prezzo Trasporto (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Es: 220.00"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTransportPriceData.price}
                            onChange={(e) => setNewTransportPriceData({ ...newTransportPriceData, price: e.target.value })}
                          />
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
                          >
                            Salva nel Listino
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                            <th className="p-3">Priorità</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Automezzo</th>
                            <th className="p-3 text-right">Prezzo Trasporto (€)</th>
                            <th className="p-3 text-center">Rimuovi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                          {transportPrices
                            .slice()
                            .sort((a: any, b: any) => {
                              if (a.client && !b.client) return -1;
                              if (!a.client && b.client) return 1;
                              return 0;
                            })
                            .map((tp: any) => (
                            <tr key={tp.id} className="hover:bg-zinc-800/20">
                              <td className="p-3">
                                {tp.client ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/40">
                                    🔗 Cliente
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                    📋 Base
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-zinc-200">
                                {tp.client ? (
                                  <span className="text-blue-400">{tp.client.name} ({tp.client.clientCode})</span>
                                ) : (
                                  <span className="text-zinc-500 font-bold italic">PREZZO BASE</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-750 mr-2">
                                  {tp.vehicle?.plateNumber}
                                </span>
                                <span className="text-zinc-400 text-xs">{tp.vehicle?.model}</span>
                              </td>
                              <td className="p-3 text-right text-emerald-400 font-mono font-bold">{formatCurrency(tp.price)}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteTransportPrice(tp.id)}
                                  className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded cursor-pointer"
                                >
                                  Elimina
                                </button>
                              </td>
                            </tr>
                          ))}
                          {transportPrices.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-zinc-500">Nessuna voce definita nel listino trasporti.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* TAB: UTENTI (ADMIN ONLY) */}
            {activeTab === 'utenti' && currentUser.role === 'ADMIN' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Gestione Utenti del Sistema</h2>
                    <p className="text-sm text-zinc-400">Aggiungi, modifica o rimuovi gli account autorizzati.</p>
                  </div>
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                  >
                    + Aggiungi Utente
                  </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-800/40 text-xs font-semibold uppercase text-zinc-400 border-b border-zinc-800">
                        <th className="p-3">Nome</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Password (In Chiaro)</th>
                        <th className="p-3">Ruolo</th>
                        <th className="p-3 text-center">Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/20">
                          <td className="p-3 font-semibold text-white">{u.name || '-'}</td>
                          <td className="p-3 text-zinc-300">{u.email}</td>
                          <td className="p-3 font-mono text-zinc-400">{u.password}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-950/40 text-purple-400 border border-purple-900' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-500 hover:text-red-400 p-1 hover:bg-zinc-800 rounded cursor-pointer disabled:opacity-30"
                              disabled={currentUser.id === u.id}
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ----------------- MODALI DI CREAZIONE ----------------- */}

      {/* TRIP MODAL */}
      {isTripModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Nuova Riga di Viaggio</h3>
              <button onClick={() => { setIsTripModalOpen(false); resetTripForm(); }} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-6">
              {(() => {
                const chosenDest = destinations.find(d => d.id === Number(newTripData.destinationId));
                const destDisplayValue = chosenDest ? `${chosenDest.name} (${chosenDest.client?.name} - ${chosenDest.shippingCode})` : '';
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Data di Consegna</label>
                        <input
                          type="date"
                          required
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.date}
                          onChange={(e) => setNewTripData({ ...newTripData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Numero Formulario (FIR)</label>
                        <input
                          type="text"
                          required
                          placeholder="Es: NVBNH006245YQ"
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                          value={newTripData.firNumber}
                          onChange={(e) => setNewTripData({ ...newTripData, firNumber: e.target.value })}
                        />
                      </div>
                      
                      {/* Searchable CER Code dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Codice CER</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca CER (es: 170107 o cemento...)"
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isCerDropdownOpen ? cerSearchInput : (wasteTypes.find(w => w.id === Number(newTripData.wasteTypeId))?.cerCode || '')}
                            onFocus={() => {
                              setIsCerDropdownOpen(true);
                              setCerSearchInput('');
                            }}
                            onChange={(e) => setCerSearchInput(e.target.value)}
                          />
                          {isCerDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              {wasteTypes
                                .filter(w => {
                                  const query = cerSearchInput.toLowerCase();
                                  return w.cerCode.toLowerCase().includes(query) || 
                                         (w.description || '').toLowerCase().includes(query);
                                })
                                .slice(0, 50)
                                .map(w => (
                                  <div
                                    key={w.id}
                                    className="p-2 text-xs text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      handleTripWasteTypeChange(String(w.id));
                                      setIsCerDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-mono font-bold bg-zinc-900 text-emerald-400 px-1.5 py-0.5 rounded mr-2">{w.cerCode}</span>
                                    <span>{w.description?.substring(0, 60)}...</span>
                                  </div>
                                ))}
                              {wasteTypes.filter(w => {
                                const query = cerSearchInput.toLowerCase();
                                return w.cerCode.toLowerCase().includes(query) || 
                                       (w.description || '').toLowerCase().includes(query);
                              }).length === 0 && (
                                <div className="p-2 text-xs text-zinc-500 text-center">Nessun codice CER trovato.</div>
                              )}
                            </div>
                          )}
                          {isCerDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsCerDropdownOpen(false)} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Searchable Destination selector (sole selector, removing client selector) */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-zinc-400 uppercase">Destinazione (Cantiere / Cliente)</label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          placeholder="Cerca e seleziona destinazione (es: Colosseo...)"
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                          value={isDestDropdownOpen ? destSearchInput : destDisplayValue}
                          onFocus={() => {
                            setIsDestDropdownOpen(true);
                            setDestSearchInput('');
                          }}
                          onChange={(e) => setDestSearchInput(e.target.value)}
                        />
                        {isDestDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                            {destinations
                              .filter(d => {
                                const query = destSearchInput.toLowerCase();
                                return d.name.toLowerCase().includes(query) || 
                                       (d.client?.name || '').toLowerCase().includes(query) ||
                                       d.shippingCode.toLowerCase().includes(query);
                              })
                              .map(d => (
                                <div
                                  key={d.id}
                                  className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                  onClick={() => {
                                    handleTripDestinationChange(String(d.id));
                                    setIsDestDropdownOpen(false);
                                  }}
                                >
                                  <span className="font-bold">{d.name}</span>
                                  <span className="text-xs ml-2 text-zinc-400">
                                    (Cod: {d.shippingCode} - Client: {d.client?.name})
                                  </span>
                                </div>
                              ))}
                            {destinations.filter(d => {
                              const query = destSearchInput.toLowerCase();
                              return d.name.toLowerCase().includes(query) || 
                                     (d.client?.name || '').toLowerCase().includes(query) ||
                                     d.shippingCode.toLowerCase().includes(query);
                            }).length === 0 && (
                              <div className="p-2 text-xs text-zinc-500 text-center">Nessuna destinazione trovata.</div>
                            )}
                          </div>
                        )}
                        {isDestDropdownOpen && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsDestDropdownOpen(false)} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Searchable Autista dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Autista</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca autista..."
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isDriverDropdownOpen ? driverSearchInput : (drivers.find(d => d.id === Number(newTripData.driverId))?.name || 'Non Assegnato')}
                            onFocus={() => {
                              setIsDriverDropdownOpen(true);
                              setDriverSearchInput('');
                            }}
                            onChange={(e) => setDriverSearchInput(e.target.value)}
                          />
                          {isDriverDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              <div
                                className="p-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  setNewTripData({ ...newTripData, driverId: '' });
                                  setIsDriverDropdownOpen(false);
                                }}
                              >
                                Non Assegnato
                              </div>
                              {drivers
                                .filter(d => d.name.toLowerCase().includes(driverSearchInput.toLowerCase()))
                                .map(d => (
                                  <div
                                    key={d.id}
                                    className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      setNewTripData({ ...newTripData, driverId: String(d.id) });
                                      setIsDriverDropdownOpen(false);
                                    }}
                                  >
                                    {d.name}
                                  </div>
                                ))}
                            </div>
                          )}
                          {isDriverDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsDriverDropdownOpen(false)} />
                          )}
                        </div>
                      </div>

                      {/* Searchable Vehicle dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Automezzo</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            placeholder="Cerca mezzo..."
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={isVehicleDropdownOpen ? vehicleSearchInput : (vehicles.find(v => v.id === Number(newTripData.vehicleId))?.plateNumber || 'Non Assegnato')}
                            onFocus={() => {
                              setIsVehicleDropdownOpen(true);
                              setVehicleSearchInput('');
                            }}
                            onChange={(e) => setVehicleSearchInput(e.target.value)}
                          />
                          {isVehicleDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-zinc-850 border border-zinc-750 rounded-lg shadow-xl z-50 divide-y divide-zinc-800">
                              <div
                                className="p-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  setNewTripData({ ...newTripData, vehicleId: '' });
                                  setIsVehicleDropdownOpen(false);
                                }}
                              >
                                Non Assegnato
                              </div>
                              {vehicles
                                .filter(v => v.plateNumber.toLowerCase().includes(vehicleSearchInput.toLowerCase()) || (v.model || '').toLowerCase().includes(vehicleSearchInput.toLowerCase()))
                                .map(v => (
                                  <div
                                    key={v.id}
                                    className="p-2 text-sm text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-colors"
                                    onClick={() => {
                                      handleTripVehicleChange(String(v.id));
                                      setIsVehicleDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-mono font-bold text-xs bg-zinc-900 text-blue-400 px-1.5 py-0.5 rounded mr-2">{v.plateNumber}</span>
                                    <span className="text-zinc-450 text-xs">{v.model}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                          {isVehicleDropdownOpen && (
                            <div className="fixed inset-0 z-40" onClick={() => setIsVehicleDropdownOpen(false)} />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase">Peso (t)</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          placeholder="Es: 12.4"
                          className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.weight}
                          onChange={(e) => handleTripWeightChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-bold text-zinc-400 uppercase">Prezzo CER (€/t)</label>
                          {priceSource.cerPrice === 'client-list' && (
                            <span className="text-xs font-bold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/40">🔗 Da listino cliente</span>
                          )}
                          {priceSource.cerPrice === 'base-list' && (
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">📋 Da listino base</span>
                          )}
                          {priceSource.cerPrice === 'manual' && (
                            <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">✏️ Manuale</span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Es: 17"
                          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                          value={newTripData.cerPrice}
                          onChange={(e) => handleTripCerPriceChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                      <span className="text-sm font-semibold text-white block mb-3">Prezzi Contabili (€)</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="block text-xs font-medium text-zinc-400">Trasporto</label>
                            {priceSource.transportPrice === 'client-list' && (
                              <span className="text-xs font-bold text-blue-400 bg-blue-950/30 px-1.5 py-0.5 rounded border border-blue-900/40">🔗 Cliente</span>
                            )}
                            {priceSource.transportPrice === 'base-list' && (
                              <span className="text-xs font-bold text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/40">📋 Base</span>
                            )}
                            {priceSource.transportPrice === 'manual' && (
                              <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">✏️</span>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.transportPrice}
                            onChange={(e) => handleTripTransportPriceChange(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Smaltimento</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.disposalPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, disposalPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Fuori Roma</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.fuoriRomaPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, fuoriRomaPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Noleggio Cassoni</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.noleggioPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, noleggioPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Fornitura Big Bag</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.bigBagPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, bigBagPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Analisi Rifiuto</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.analisiPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, analisiPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Carico Ragno</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.servRagnoPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, servRagnoPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400">Indennizzo Sosta</label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                            value={newTripData.sostaPrice}
                            onChange={(e) => setNewTripData({ ...newTripData, sostaPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4 bg-zinc-850/50 p-4 rounded-xl border">
                      <span className="text-sm font-semibold text-white block mb-2">Anteprima Totale Contabile (Calcolato)</span>
                      {(() => {
                        const tPrice = Number(newTripData.transportPrice || 0) + Number(newTripData.fuoriRomaPrice || 0);
                        const dPrice = Number(newTripData.disposalPrice || 0);
                        const accPrice =
                          Number(newTripData.noleggioPrice || 0) +
                          Number(newTripData.bigBagPrice || 0) +
                          Number(newTripData.analisiPrice || 0) +
                          Number(newTripData.servRagnoPrice || 0) +
                          Number(newTripData.sostaPrice || 0);
                        const previewTaxable = tPrice + dPrice + accPrice;
                        const previewIva = previewTaxable * 0.22;
                        const previewTotal = previewTaxable * 1.22;
                        return (
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                              <span className="block text-xs text-zinc-400 font-medium">Imponibile Anteprima</span>
                              <span className="text-sm font-bold text-zinc-200">{formatCurrency(previewTaxable)}</span>
                            </div>
                            <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                              <span className="block text-xs text-zinc-400 font-medium">IVA (22%) Anteprima</span>
                              <span className="text-sm font-bold text-indigo-400">{formatCurrency(previewIva)}</span>
                            </div>
                            <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800 bg-emerald-950/20 border-emerald-900/50">
                              <span className="block text-xs text-emerald-450 font-bold font-sans">Totale Ivato Anteprima</span>
                              <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(previewTotal)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase font-sans">Annotazioni</label>
                      <textarea
                        rows={2}
                        className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                        value={newTripData.notes}
                        onChange={(e) => setNewTripData({ ...newTripData, notes: e.target.value })}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsTripModalOpen(false); resetTripForm(); }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold cursor-pointer"
                >
                  Registra Viaggio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CONFERMA SALVATAGGIO LISTINO */}
      {isListinoConfirmOpen && pendingListinoSave && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="text-lg font-bold text-white">Vuoi aggiornare il listino prezzi?</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Hai inserito prezzi diversi dal listino attuale. Vuoi aggiornare il listino con i nuovi valori?
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {pendingListinoSave.cerPrice && (
                <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase">Smaltimento CER</span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        CER <span className="font-mono text-emerald-400">{pendingListinoSave.cerPrice.cerCode}</span>
                        {' · '}
                        <span className="text-blue-400">{pendingListinoSave.cerPrice.clientName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500">Nuovo prezzo</span>
                      <p className="text-lg font-bold text-amber-400">
                        {formatCurrency(pendingListinoSave.cerPrice.pricePerQuintal * 10)}/t
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {pendingListinoSave.transportPrice && (
                <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase">Trasporto</span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        Mezzo <span className="font-mono text-blue-400">{pendingListinoSave.transportPrice.plateNumber}</span>
                        {' · '}
                        <span className="text-blue-400">{pendingListinoSave.transportPrice.clientName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500">Nuovo prezzo</span>
                      <p className="text-lg font-bold text-emerald-400">
                        {formatCurrency(pendingListinoSave.transportPrice.price)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSaveToListino(!!pendingListinoSave?.cerPrice, !!pendingListinoSave?.transportPrice)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
              >
                ✅ Sì, aggiorna il listino con i nuovi prezzi
              </button>
              <button
                onClick={() => handleSaveToListino(false, false)}
                className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Solo questo viaggio — non aggiornare il listino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT MODAL */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Cliente</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Es: CL001"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newClientData.clientCode}
                  onChange={(e) => setNewClientData({ ...newClientData, clientCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ragione Sociale</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo Sede (Fatturazione)</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newClientData.billingAddress}
                  onChange={(e) => setNewClientData({ ...newClientData, billingAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Partita IVA / Cod. Fiscale</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newClientData.vatNumber}
                  onChange={(e) => setNewClientData({ ...newClientData, vatNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESTINATION MODAL */}
      {isDestinationModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Destinazione</h3>
              <button onClick={() => setIsDestinationModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDestination} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Cliente Collegato (Fatturazione)</label>
                <select
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newDestinationData.clientId}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, clientId: e.target.value })}
                >
                  <option value="">Seleziona Cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice Spedizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es: SP001"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newDestinationData.shippingCode}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, shippingCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome Destinazione/Cantiere</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Cantiere Colosseo"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDestinationData.name}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo di Spedizione</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Piazza del Colosseo 1, Roma"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDestinationData.address}
                  onChange={(e) => setNewDestinationData({ ...newDestinationData, address: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDestinationModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Destinazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Autista</h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome e Cognome</label>
                <input
                  type="text"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData({ ...newDriverData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Email</label>
                <input
                  type="email"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.email}
                  onChange={(e) => setNewDriverData({ ...newDriverData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Telefono</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newDriverData.phone}
                  onChange={(e) => setNewDriverData({ ...newDriverData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Numero Patente</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newDriverData.licenseNumber}
                  onChange={(e) => setNewDriverData({ ...newDriverData, licenseNumber: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Autista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VEHICLE MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Automezzo</h3>
              <button onClick={() => setIsVehicleModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Targa</label>
                <input
                  type="text"
                  required
                  placeholder="Es: HD014KY"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                  value={newVehicleData.plateNumber}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, plateNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Modello Veicolo</label>
                <input
                  type="text"
                  placeholder="Es: Iveco Stralis"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newVehicleData.model}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Portata Utile (kg)</label>
                <input
                  type="number"
                  placeholder="Es: 26000"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newVehicleData.capacity}
                  onChange={(e) => setNewVehicleData({ ...newVehicleData, capacity: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Mezzo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WASTE MODAL */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Codice EER/CER (Articolo)</h3>
              <button onClick={() => setIsWasteModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateWaste} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Codice CER</label>
                <input
                  type="text"
                  required
                  placeholder="Es: 170904"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newWasteData.cerCode}
                  onChange={(e) => setNewWasteData({ ...newWasteData, cerCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Descrizione del Rifiuto</label>
                <textarea
                  rows={3}
                  placeholder="Inserisci la descrizione ufficiale del rifiuto..."
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newWasteData.description}
                  onChange={(e) => setNewWasteData({ ...newWasteData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsWasteModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Codice CER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">Aggiungi Nuovo Utente</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Nome dell'utente</label>
                <input
                  type="text"
                  required
                  placeholder="Es: Maria Rossi"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Indirizzo Email (Username)</label>
                <input
                  type="email"
                  required
                  placeholder="maria@brecitrasporti.it"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Password</label>
                <input
                  type="text"
                  required
                  placeholder="Password di accesso"
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400">Ruolo Sistema</label>
                <select
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="OPERATOR">Operatore (Solo visualizzazione e inserimenti)</option>
                  <option value="ADMIN">Amministratore (Pieno controllo + Gestione Utenti)</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salva Utente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white font-sans">
                {newScheduleData.id ? 'Modifica Pianificazione' : 'Pianifica Nuovo Viaggio'}
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 hover:bg-zinc-800 rounded-md cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 font-sans">Autista (Trasportatore)</label>
                <select
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newScheduleData.driverId}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, driverId: e.target.value })}
                >
                  <option value="">Seleziona Autista...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 font-sans">Automezzo (Camion)</label>
                <select
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newScheduleData.vehicleId}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, vehicleId: e.target.value })}
                >
                  <option value="">Seleziona Veicolo...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plateNumber} - {v.model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 font-sans">Data e Ora Inizio Viaggio</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newScheduleData.startDate}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 font-sans">Data e Ora Fine Viaggio</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  value={newScheduleData.endDate}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, endDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 font-sans">Note / Indicazioni cantiere</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-500"
                  placeholder="Es. Consegna prevista per le ore 10:00 al cantiere Colosseo."
                  value={newScheduleData.notes}
                  onChange={(e) => setNewScheduleData({ ...newScheduleData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <div>
                  {newScheduleData.id && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteSchedule(newScheduleData.id!);
                        setIsScheduleModalOpen(false);
                      }}
                      className="px-3 py-2 bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 text-red-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Elimina
                    </button>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {newScheduleData.id ? 'Salva Modifiche' : 'Salva Pianificazione'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


