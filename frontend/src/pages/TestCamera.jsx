import React, { useEffect, useRef, useState } from 'react';

const TestCamera = () => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                setError(err.message);
            }
        };
        start();
    }, []);

    return (
        <div className="p-10 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl mb-4">Hardware Test</h1>
            {error && <div className="text-red-500 bg-red-100 p-4 rounded mb-4">{error}</div>}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls
                className="w-[600px] h-[400px] border-4 border-white bg-gray-800"
            ></video>
        </div>
    );
};

export default TestCamera;
