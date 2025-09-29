import React from 'react';

// Reusable Government style header bar used on login page and across the app
// Purely presentational – no navigation or auth controls here.
const GovHeaderBar = () => {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full pr-4 pl-0 md:pl-2 py-3 flex items-center justify-between gap-6">
        {/* Left: Logo + Title + Emblem cluster */}
        <div className="flex items-center gap-4 min-w-0">
          <img
            src="/assets/images/no_image.png"
            alt="AYUSH Logo"
            className="h-12 w-auto object-contain select-none hidden sm:block"
            draggable={false}
          />
          <div className="leading-tight">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-gray-900">MediSync</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium uppercase">National AYUSH Terminology Platform</p>
          </div>
          <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
            <img
              src="/assets/images/ashoka_emblem.png"
              alt="National Emblem of India - Satyameva Jayate"
              className="h-12 w-auto object-contain select-none"
              draggable={false}
            />
            <div className="leading-snug hidden sm:block">
              <p className="text-[10px] sm:text-xs font-semibold tracking-wide text-gray-800 uppercase">Government of India</p>
              <p className="text-[10px] sm:text-xs font-medium tracking-wide text-gray-700">Ministry of Ayush</p>
            </div>
          </div>
        </div>

        {/* Right: Azadi branding */}
        <div className="flex items-center flex-shrink-0">
          <img
            src="/assets/images/azadi_ka_amrit_mahotsav.png"
            alt="Azadi Ka Amrit Mahotsav"
            className="h-12 md:h-14 w-auto object-contain select-none"
            draggable={false}
          />
        </div>
      </div>
    </header>
  );
};

export default GovHeaderBar;
