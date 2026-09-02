import React from 'react';

export default function DownloadApp() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
        <div className="bg-blue-600/20 text-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">App Autisti Breci Trasporti</h1>
        <p className="text-zinc-400 mb-8">
          Scarica e installa l'applicazione Android ufficiale per la gestione dei viaggi.
        </p>
        <a
          href="/driver-app.apk"
          download
          className="block w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-lg transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Scarica APK (Android)
        </a>
        <div className="mt-8 text-sm text-zinc-500">
          <p>Nota: Potrebbe essere necessario abilitare l'installazione di app da origini sconosciute sul tuo dispositivo.</p>
        </div>
      </div>
    </div>
  );
}
