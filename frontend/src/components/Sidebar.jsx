import React from 'react';
import {
  Boxes,
  LayoutDashboard,
  AlertTriangle,
  X,
  Server,
  Layers,
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Items', icon: Boxes },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Inventory</h1>
            <p className="text-xs text-indigo-600 font-medium">Counter System</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Server Status Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
          <Server className="w-4 h-4 text-emerald-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">FastAPI + SQLite</p>
            <p className="text-2xs text-slate-400 truncate">127.0.0.1:8000</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-white shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
