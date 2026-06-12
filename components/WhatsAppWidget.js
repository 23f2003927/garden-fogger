"use client";
import { useState } from "react";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl p-4 w-80 mb-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Send WhatsApp Message</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 font-bold text-lg"
            >
              &times;
            </button>
          </div>
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (with country code)</label>
              <input 
                type="text" 
                placeholder="e.g. 919876543210" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                placeholder="Type your message..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] text-gray-900 bg-white resize-none"
              />
            </div>
            <button 
              onClick={handleSend}
              className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-medium py-2 rounded-md transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      ) : null}
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#25D366] hover:bg-[#1ebd5a] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center w-14 h-14 ml-auto"
          aria-label="Open WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
