'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/inmuebles', label: 'Inmuebles' },
  { href: '/gastos', label: 'Conceptos de Gasto' },
  { href: '/periodos-cobro', label: 'Periodos de Cobro' },
  { href: '/mis-recibos', label: 'Mis Recibos' },
  { href: '/configuracion', label: 'Configuración' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 bg-light vh-100 border-end" style={{ width: '280px' }}>
      <ul className="nav nav-pills flex-column mb-auto">
        {navLinks.map((link) => (
          <li className="nav-item" key={link.href}>
            <Link
              href={link.href}
              className={`nav-link ${pathname.startsWith(link.href) ? 'active' : 'link-dark'}`}
              aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
