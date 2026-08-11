type IconProps = { className?: string; size?: number };

function base(children: React.ReactNode, { className, size = 20 }: IconProps = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>,
    p
  );

export const PlusCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>,
    p
  );

export const HistoryIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </>,
    p
  );

export const FileTextIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </>,
    p
  );

export const HelpCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.5 2.5 0 1 1 3.4 2.3c-.9.5-1.4 1-1.4 2" />
      <path d="M12 17h.01" />
    </>,
    p
  );

export const SettingsIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
    </>,
    p
  );

export const BellIcon = (p: IconProps) =>
  base(
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.2 1 5 1.5 6H4.5C5 14 6 12.2 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>,
    p
  );

export const ChevronDownIcon = (p: IconProps) => base(<path d="m6 9 6 6 6-6" />, p);

export const ShieldCheckIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9.5 12 2 2 3.5-4" />
    </>,
    p
  );

export const CalculatorIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h1M11.5 11h1M15 11h1M8 15h1M11.5 15h1M15 15v4M8 18.5h1M11.5 18.5h1" />
    </>,
    p
  );

export const SpellCheckIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 15 8 5l4 10M5.2 12h5.6" />
      <path d="m14 13 2.5 2.5L21 10" />
    </>,
    p
  );

export const GridIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
    p
  );

export const CheckCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.2 2.2 4.8-5.4" />
    </>,
    p
  );

export const UploadCloudIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 18a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 16.7 8H17a4 4 0 0 1 1 7.9" />
      <path d="M12 12v7M9.5 15.5 12 13l2.5 2.5" />
    </>,
    p
  );

export const DownloadIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 4v11M8 11.5 12 15l4-3.5" />
      <path d="M5 19h14" />
    </>,
    p
  );

export const FileSpreadsheetIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 16.5h6M9 13v6.5M12 13v6.5M15 13v6.5" />
    </>,
    p
  );

export const AlertTriangleIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 10v4M12 17h.01" />
    </>,
    p
  );

export const Building2Icon = (p: IconProps) =>
  base(
    <>
      <path d="M4 21V6l8-3 8 3v15" />
      <path d="M9 21v-4h6v4M9 9h1M9 13h1M14 9h1M14 13h1M4 21h16" />
    </>,
    p
  );

export const XIcon = (p: IconProps) => base(<path d="M6 6l12 12M18 6 6 18" />, p);

export const ClockIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>,
    p
  );

export const TrashIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </>,
    p
  );

export const UserIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </>,
    p
  );

export const CrownIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 8l4 4 5-6 5 6 4-4-2 11H5L3 8Z" />
      <path d="M5 19h14" />
    </>,
    p
  );

export const LogOutIcon = (p: IconProps) =>
  base(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
    p
  );

export const BuildingPlusIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 21V6l8-3 8 3v15" />
      <path d="M9 21v-4h6v4M4 21h16" />
      <path d="M12 8v4M10 10h4" />
    </>,
    p
  );

export const EyeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>,
    p
  );
