import { Injectable } from '@angular/core';

export interface NavChild {
  label: string;
  route: string;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  title?: string;
  children?: NavChild[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private menuSections: NavSection[] = [
    {
      title: 'Main Menu',
      items: [
        {
          label: 'Dashboard',
          icon: 'fa-solid fa-table-cells-large',
          route: '/dashboard',
          title: 'Dashboard'
        },
        {
          label: 'Ledger',
          icon: 'fa-solid fa-book',
          route: '/ledger',
          title: 'Ledger'
        },
        {
          label: 'Customer',
          icon: 'fa-solid fa-users',
          route: '/customer',
          title: 'Customer'
        },
        {
          label: 'Merchants',
          icon: 'fa-solid fa-store',
          route: '/merchant',
          title: 'Merchants'
        },
        {
          label: 'Enterprises',
          icon: 'fa-solid fa-building-shield',
          route: '/enterprises',
          title: 'Enterprises'
        },
        {
          label: 'Transactions',
          icon: 'fa-solid fa-right-left',
          route: '/transactions',
          title: 'Transactions'
        },
        {
          label: 'Top Users',
          icon: 'fa-solid fa-ranking-star',
          route: '/top-users',
          title: 'Top Users'
        }
      ]
    },
    {
      title: 'Security & Monitoring',
      items: [
        {
          label: 'Fraud Alerts',
          icon: 'fa-solid fa-triangle-exclamation',
          route: '/fraud-alerts',
          title: 'Fraud Alerts'
        },
        {
          label: 'Notifications',
          icon: 'fa-solid fa-bell',
          route: '/notifications',
          title: 'Notifications'
        },
        {
          label: 'Audit Log',
          icon: 'fa-solid fa-clipboard-list',
          route: '/audit-log',
          title: 'Audit Log'
        }
      ]
    },
    {
      title: 'System',
      items: [
        {
          label: 'Settings',
          icon: 'fa-solid fa-gear',
          route: '/settings',
          title: 'Settings',
          children: [
            { label: 'Profile', route: '/settings/profile' },
            { label: 'Security', route: '/settings/security' },
            { label: 'Configuration', route: '/settings/system' },
            { label: 'Team', route: '/settings/team' }
          ]
        }
      ]
    }
  ];

  getMenuSections(): NavSection[] {
    return JSON.parse(JSON.stringify(this.menuSections));
  }
}
