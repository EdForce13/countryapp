import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// Interfaces para tipar los datos de la API
interface CountryName {
    common: string;
    official: string;
}

interface CountryFlag {
    png: string;
    svg: string;
    alt: string;
}

interface Country {
    name: CountryName;
    flags: CountryFlag;
    cca3: string; // Usaremos cca3 como un id único
}

interface Currency {
    name: string;
    symbol: string;
}

interface Language {
    [key: string]: string;
}

interface CountryDetail extends Country {
    capital: string[];
    region: string;
    subregion: string;
    population: number;
    currencies: { [key: string]: Currency };
    languages: Language;
}

const API_URL_ALL = 'https://restcountries.com/v3.1/all';
const API_URL_NAME = 'https://restcountries.com/v3.1/name/';

// Componente Loader
const Loader = () => (
    <div className="loader-container" aria-label="Cargando...">
        <div className="loader"></div>
    </div>
);

// Componente para mostrar errores
const ErrorMessage = ({ message }: { message: string }) => (
    <div className="error-message">
        <p>¡Ups! Ocurrió un error.</p>
        <p>{message}</p>
    </div>
);

// Componente para la tarjeta de un país
const CountryCard = ({ country, onSelect }: { country: Country; onSelect: (name: string) => void; }) => (
    <article className="country-card" onClick={() => onSelect(country.name.common)} role="button" tabIndex={0}>
        <img src={country.flags.svg} alt={country.flags.alt || `Bandera de ${country.name.common}`} loading="lazy" />
        <div className="country-card-info">
            <h3>{country.name.common}</h3>
        </div>
    </article>
);

// Componente para la vista de detalle
const CountryDetailView = ({ name, onBack }: { name: string; onBack: () => void; }) => {
    const [detail, setDetail] = useState<CountryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL_NAME}${name}`);
                if (!response.ok) {
                    throw new Error('No se pudo encontrar el país.');
                }
                const data = await response.json();
                // La API devuelve un array, tomamos el primer resultado que suele ser el más relevante
                setDetail(data[0]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [name]);

    if (loading) return <Loader />;
    if (error) return <ErrorMessage message={error} />;
    if (!detail) return <ErrorMessage message="No se encontraron datos para este país." />;
    
    const formatPopulation = (num: number) => new Intl.NumberFormat('es-ES').format(num);

    return (
        <section className="detail-view" aria-labelledby="country-title">
            <button onClick={onBack} className="back-button">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Volver
            </button>
            <div className="detail-content">
                <img src={detail.flags.svg} alt={detail.flags.alt || `Bandera de ${detail.name.common}`} />
                <div className="detail-info">
                    <h2 id="country-title">{detail.name.common}</h2>
                    <div className="detail-grid">
                        <p><strong>Nombre oficial:</strong> {detail.name.official}</p>
                        <p><strong>Capital:</strong> {detail.capital?.join(', ') || 'N/A'}</p>
                        <p><strong>Población:</strong> {formatPopulation(detail.population)}</p>
                        <p><strong>Región:</strong> {detail.region}</p>
                        <p><strong>Subregión:</strong> {detail.subregion}</p>
                        <p><strong>Monedas:</strong> {Object.values(detail.currencies).map(c => c.name).join(', ')}</p>
                        <p><strong>Idiomas:</strong> {Object.values(detail.languages).join(', ')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};


const App = () => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    useEffect(() => {
        const getCountries = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL_ALL}?fields=name,flags,cca3`);
                if (!response.ok) {
                    throw new Error('La respuesta de la red no fue correcta.');
                }
                const data: Country[] = await response.json();
                // Ordenamos los países alfabéticamente por su nombre común
                data.sort((a, b) => a.name.common.localeCompare(b.name.common));
                setCountries(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al obtener los datos');
            } finally {
                setLoading(false);
            }
        };
        getCountries();
    }, []);

    const filteredCountries = useMemo(() =>
        countries.filter(country =>
            country.name.common.toLowerCase().includes(searchTerm.toLowerCase())
        ), [countries, searchTerm]);

    const handleSelectCountry = (name: string) => {
        setSelectedCountry(name);
    };

    const handleBack = () => {
        setSelectedCountry(null);
    };

    if (selectedCountry) {
        return <CountryDetailView name={selectedCountry} onBack={handleBack} />;
    }

    return (
        <main>
            <header className="header">
                <h1>Explorador de Países</h1>
            </header>
            
            <div className="search-container">
                 <input
                    type="search"
                    className="search-input"
                    placeholder="Buscar un país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar un país"
                />
            </div>
           
            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}
            
            {!loading && !error && (
                 <section className="countries-grid" aria-label="Lista de países">
                    {filteredCountries.map(country => (
                        <CountryCard key={country.cca3} country={country} onSelect={handleSelectCountry} />
                    ))}
                </section>
            )}
        </main>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
