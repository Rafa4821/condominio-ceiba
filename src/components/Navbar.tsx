'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container-fluid">
        <Link href="/dashboard" className="navbar-brand">
          Condominio Ceiba
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {/* El botón de cerrar sesión ha sido removido */}
          </ul>
        </div>
      </div>
    </nav>
  );
}
