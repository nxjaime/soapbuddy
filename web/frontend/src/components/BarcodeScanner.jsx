import { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Package, Loader2, Check } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);


    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128
                ]
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            console.log(`Code matched = ${decodedText}`, decodedResult);
            scanner.clear();
            handleBarcodeLookup(decodedText);
        }

        function onScanFailure(_error) {
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner", error);
            });
        };
    }, []);

    async function handleBarcodeLookup(barcode) {
        setLookupLoading(true);
        try {
            // Using Open Food Facts API (free, no key required for basic lookups)
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await response.json();

            if (data.status === 1) {
                const product = data.product;
                const result = {
                    barcode: barcode,
                    name: product.product_name || '',
                    brand: product.brands || '',
                    inci: product.ingredients_text_en || product.ingredients_text || '',
                    image: product.image_url || null
                };
                setLookupResult(result);
            } else {
                // Product not found, but we still have the barcode
                setLookupResult({
                    barcode: barcode,
                    name: '',
                    brand: '',
                    inci: '',
                    image: null,
                    notFound: true
                });
            }
        } catch (err) {
            console.error('Barcode lookup failed:', err);
            setLookupResult({
                barcode: barcode,
                name: '',
                brand: '',
                inci: '',
                notFound: true
            });
        } finally {
            setLookupLoading(false);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Camera size={20} className="icon" />
                        Scan Barcode
                    </h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    {!lookupResult && !lookupLoading && (
                        <div id="reader" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}></div>
                    )}

                    {lookupLoading && (
                        <div className="empty-state">
                            <Loader2 className="loading-spinner" />
                            <p>Looking up product details...</p>
                        </div>
                    )}

                    {lookupResult && (
                        <div className="lookup-result" style={{ textAlign: 'center' }}>
                            {lookupResult.image ? (
                                <img
                                    src={lookupResult.image}
                                    alt={lookupResult.name}
                                    style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: 'var(--spacing-md)' }}
                                />
                            ) : (
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--border-radius-md)',
                                    margin: '0 auto var(--spacing-md)'
                                }}>
                                    <Package size={40} color="var(--text-muted)" />
                                </div>
                            )}

                            {lookupResult.notFound ? (
                                <>
                                    <h3 style={{ color: 'var(--color-warning)' }}>Product Not Found</h3>
                                    <p>We couldn't find details for barcode <strong>{lookupResult.barcode}</strong>.</p>
                                    <p>You can still add it manually.</p>
                                </>
                            ) : (
                                <>
                                    <h3 style={{ color: 'var(--color-success)' }}>Product Found!</h3>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                                        {lookupResult.name}
                                    </p>
                                    {lookupResult.brand && (
                                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                                            Brand: {lookupResult.brand}
                                        </p>
                                    )}
                                </>
                            )}

                            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
                                <button className="btn btn-secondary" onClick={() => setLookupResult(null)}>
                                    Rescan
                                </button>
                                <button className="btn btn-primary" onClick={() => onScan(lookupResult)}>
                                    <Check size={18} />
                                    Use This Ingredient
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
