type Source = {
  title: { en: string; es: string };
  url: string;
  publisher: string;
  /** When the source was published or last checked, as the source states it. */
  date: string;
  /** The site refuses automated requests (bot challenge or 403); the link works in a browser. */
  blocked?: boolean;
  /** The City's own link is dead; this is an Internet Archive copy. */
  archived?: boolean;
  lang?: string;
};

const both = (title: string, es = title) => ({ en: title, es });

const registry = {
  parkingPage: {
    title: both('Downtown Public Parking', 'Downtown Public Parking (página de la Ciudad)'),
    url: 'https://ashlandoregon.gov/230/Downtown-Public-Parking',
    publisher: 'City of Ashland',
    date: 'checked October 2, 2026',
  },
  parkingMap: {
    title: both('Downtown Public Parking map (2023)', 'mapa de estacionamiento del centro (2023)'),
    url: 'https://gis.ashland.or.us/hub/pdf/public_works/parking_downtown.pdf',
    publisher: 'City of Ashland',
    date: '2023',
  },
  laz: {
    title: both('Hargadine Garage monthly pass (LAZ Parking)', 'pase mensual del garaje Hargadine (LAZ Parking)'),
    url: 'https://go.lazparking.com/subnow?l=171810',
    publisher: 'LAZ Parking',
    date: 'checked October 2, 2026',
  },
  feeSchedule: {
    title: both('Miscellaneous Fees and Charges, effective July 1, 2026', 'tarifas y cargos de la Ciudad, vigentes desde el 1 de julio de 2026'),
    url: 'https://ashlandoregon.gov/ArchiveCenter/ViewFile/Item/541',
    publisher: 'City of Ashland',
    date: 'Council approved May 19, 2026',
  },
  amc1126: {
    title: both('AMC Chapter 11.26, Parking Regulations', 'Código Municipal de Ashland, capítulo 11.26'),
    url: 'https://ashland.municipal.codes/AMC/11.26',
    publisher: 'City of Ashland',
    date: 'current through Ord. 3306, August 4, 2026',
    blocked: true,
  },
  amc204050: {
    title: both('AMC 2.04.050, Council meetings and public forum', 'Código Municipal 2.04.050, reuniones y foro público'),
    url: 'https://ashland.municipal.codes/AMC/2.04.050',
    publisher: 'City of Ashland',
    date: 'current through Ord. 3306, August 4, 2026',
    blocked: true,
  },
  ord3306: {
    title: both('Ordinance 3306 (July 21, 2026 council packet, pp. 193–197)', 'Ordenanza 3306 (paquete del Concejo, 21 de julio de 2026)'),
    url: 'https://ashlandor.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=3498,plainText=false)',
    publisher: 'City of Ashland',
    date: 'adopted August 4, 2026',
  },
  parkingPlan: {
    title: both('Downtown Strategic Parking Management Plan (2015)', 'Plan Estratégico de Estacionamiento del Centro (2015)'),
    url: 'https://web.archive.org/web/20201021111831/http://www.ashland.or.us/SIB/files/ASHLAND%20%2D%20Parking%20Managment%20Plan%20%2D%20FINAL%20REPORT%2012_29_15%20(6).pdf',
    publisher: 'Rick Williams Consulting for the City of Ashland',
    date: 'December 29, 2015',
    archived: true,
  },
  council: {
    title: both('City Council', 'Concejo Municipal'),
    url: 'https://ashlandoregon.gov/379/City-Council',
    publisher: 'City of Ashland',
    date: 'checked October 2, 2026',
  },
  testimonyForm: {
    title: both('City Council Public Testimony Form', 'formulario de testimonio público'),
    url: 'https://ashlandoregon.gov/FormCenter/City-Recorder-5/City-Council-Public-Testimony-Form-92',
    publisher: 'City of Ashland',
    date: 'checked October 2, 2026',
  },
  contactCouncil: {
    title: both('Contact City Council form', 'formulario de contacto del Concejo'),
    url: 'https://ashlandoregon.gov/FormCenter/City-Council-16/Contact-City-Council-111',
    publisher: 'City of Ashland',
    date: 'checked October 2, 2026',
  },
  chautauquaPostcard: {
    title: both('Chautauqua Building, Ashland (postcard, 1918–23)', 'Edificio Chautauqua, Ashland (postal, 1918–23)'),
    url: 'https://digitalcollections.lib.washington.edu/digital/collection/alaskawcanada/id/1817',
    publisher: 'Darling Studio, Ashland. University of Washington Libraries, Special Collections, AWC2566',
    date: 'public domain (published before 1931)',
  },
  osm: {
    title: both('OpenStreetMap', 'OpenStreetMap'),
    url: 'https://www.openstreetmap.org/copyright',
    publisher: 'OpenStreetMap contributors',
    date: 'data fetched October 2, 2026',
  },
  danville: {
    title: both('Downtown Employee Permit Parking'),
    url: 'https://www.danville.ca.gov/178/Downtown-Employee-Permit-Parking',
    publisher: 'Town of Danville, CA',
    date: '2026 program',
  },
  grantsPass: {
    title: both('Downtown parking permit application'),
    url: 'https://www.grantspassoregon.gov/DocumentCenter/View/11197',
    publisher: 'City of Grants Pass, OR',
    date: 'March 3, 2026',
  },
  davis: {
    title: both('Parking enforcement and permits'),
    url: 'https://www.cityofdavis.org/city-hall/police-department/parking-enforcement',
    publisher: 'City of Davis, CA',
    date: 'checked October 2, 2026',
    blocked: true,
  },
  losGatos: {
    title: both('Employee Parking Permits'),
    url: 'https://losgatosca.gov/3010/Employee-Parking-Permits',
    publisher: 'Town of Los Gatos, CA',
    date: 'checked October 2, 2026',
  },
  santaCruz: {
    title: both('Parking Services'),
    url: 'https://www.santacruzca.gov/Services/Parking-Services',
    publisher: 'City of Santa Cruz, CA',
    date: 'rates effective July 1, 2023',
    blocked: true,
  },
  boulder: {
    title: both('Parking access permit eligibility'),
    url: 'https://bouldercolorado.gov/parking-access-permit-eligibility-and-requirements',
    publisher: 'City of Boulder, CO',
    date: 'checked October 2, 2026',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof registry;

/** Every source the site cites, by id. */
export const sources: Record<SourceId, Source> = registry;
