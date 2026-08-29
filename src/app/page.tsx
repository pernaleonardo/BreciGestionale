import { db } from "../prisma/db";

// Helper per formattare i numeri come valuta (€)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

// Helper per formattare i pesi
const formatWeight = (value: number) => {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
};

export default async function Home() {
  // Carica tutti i viaggi con le relazioni associate
  const trips = await db.orm.public.Trip
    .include('producer')
    .include('recipient')
    .include('driver')
    .include('vehicle')
    .all();

  // Calcoli dei totali
  const totalTrips = trips.length;
  const totalWeight = trips.reduce((sum, t) => sum + t.weight, 0);
  
  const totalTransport = trips.reduce(
    (sum, t) => sum + t.transportPrice + t.fuoriRomaPrice,
    0
  );
  
  const totalDisposal = trips.reduce((sum, t) => sum + t.disposalPrice, 0);
  
  const totalAccessories = trips.reduce(
    (sum, t) =>
      sum +
      t.noleggioPrice +
      t.bigBagPrice +
      t.analisiPrice +
      t.servRagnoPrice +
      t.sostaPrice,
    0
  );

  const totalTaxable = totalTransport + totalDisposal + totalAccessories;
  const totalInvoice = totalTaxable * 1.22; // Assumendo IVA al 22%

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans p-6 md:p-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Breci Trasporti s.r.l.</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Gestione Logistica Viaggi & Formulari Identificazione Rifiuti (FIR)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
            Database Connesso (Supabase)
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Viaggi Totali</p>
          <p className="text-2xl font-bold mt-2">{totalTrips}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Peso Gestito (t)</p>
          <p className="text-2xl font-bold mt-2">{formatWeight(totalWeight)} t</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Totale Trasporti</p>
          <p className="text-2xl font-bold mt-2 text-blue-600 dark:text-blue-400">{formatCurrency(totalTransport)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Totale Smaltimenti</p>
          <p className="text-2xl font-bold mt-2 text-amber-600 dark:text-amber-400">{formatCurrency(totalDisposal)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Imponibile Totale</p>
          <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(totalTaxable)}</p>
        </div>
      </section>

      {/* Trips Table Section */}
      <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-bold">Registro Viaggi Giornalieri (simil-Excel)</h2>
          <span className="text-xs text-zinc-500">Mostrati {trips.length} record</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-100/55 dark:bg-zinc-800/40 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <th className="p-3">Data</th>
                <th className="p-3">N. FIR</th>
                <th className="p-3">CER</th>
                <th className="p-3">Prezzo EER</th>
                <th className="p-3 text-right">Peso (t)</th>
                <th className="p-3">Mezzo</th>
                <th className="p-3">Autista</th>
                <th className="p-3 text-right">Trasporto</th>
                <th className="p-3 text-right">Smaltimento</th>
                <th className="p-3 text-right">Accessori</th>
                <th className="p-3 text-right font-bold">Imponibile</th>
                <th className="p-3">Indirizzo Cantiere</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {trips.map((trip) => {
                const rowTransport = trip.transportPrice + trip.fuoriRomaPrice;
                const rowDisposal = trip.disposalPrice;
                const rowAccessories =
                  trip.noleggioPrice +
                  trip.bigBagPrice +
                  trip.analisiPrice +
                  trip.servRagnoPrice +
                  trip.sostaPrice;
                const rowTaxable = rowTransport + rowDisposal + rowAccessories;

                return (
                  <tr key={trip.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="p-3 whitespace-nowrap font-medium">{trip.date}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        {trip.firNumber}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 ring-1 ring-inset ring-zinc-600/10">
                        {trip.cerCode}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500">{formatCurrency(trip.cerPrice)}</td>
                    <td className="p-3 text-right font-semibold">{formatWeight(trip.weight)}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                        {(trip.vehicle?.plateNumber as string) || "-"}
                      </span>
                    </td>
                    <td className="p-3">{(trip.driver?.name as string) || "-"}</td>
                    <td className="p-3 text-right">{formatCurrency(rowTransport)}</td>
                    <td className="p-3 text-right">{formatCurrency(rowDisposal)}</td>
                    <td className="p-3 text-right text-zinc-500">
                      {rowAccessories > 0 ? formatCurrency(rowAccessories) : "-"}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(rowTaxable)}
                    </td>
                    <td className="p-3 max-w-xs truncate text-zinc-500" title={trip.address || ""}>
                      {trip.address || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-100/55 dark:bg-zinc-800/40 font-bold border-t border-zinc-200 dark:border-zinc-800">
                <td className="p-3" colSpan={4}>Totali Generali</td>
                <td className="p-3 text-right">{formatWeight(totalWeight)} t</td>
                <td className="p-3" colSpan={2}></td>
                <td className="p-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(totalTransport)}</td>
                <td className="p-3 text-right text-amber-600 dark:text-amber-400">{formatCurrency(totalDisposal)}</td>
                <td className="p-3 text-right text-zinc-500">{formatCurrency(totalAccessories)}</td>
                <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(totalTaxable)}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Registry Information */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-lg font-bold mb-4">Anagrafica Produttori & Destinatari</h3>
          <p className="text-sm text-zinc-500 mb-4">I soggetti coinvolti nei formulari caricati:</p>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div>
                <span className="font-semibold">P&M GROUP SRL</span>
                <p className="text-xs text-zinc-400">Produttore - Via dell'Amba Aradam 22, Roma</p>
              </div>
              <span className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">Cod.Fisc: 15517251003</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold">RIME 1 SRL</span>
                <p className="text-xs text-zinc-400">Destinatario - Via di Magliana 1098, Roma</p>
              </div>
              <span className="text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">Destinazione: R13</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-lg font-bold mb-4">Mezzi & Autisti Attivi</h3>
          <p className="text-sm text-zinc-500 mb-4">Stato delle risorse aziendali:</p>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div>
                <span className="font-semibold">Leonardo Perna</span>
                <p className="text-xs text-zinc-400">Autista - perna.leonardo@gmail.com</p>
              </div>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">Disponibile</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold">Flotta Veicoli (4 registrati)</span>
                <p className="text-xs text-zinc-400">Targhe: HD014KY, GK273YM, GR373VD, HE921ZX</p>
              </div>
              <span className="text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">Attivi</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

