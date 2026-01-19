import './view.css';

export default function ViewLoading() {
    return (
        <div className="loading-container">
            <div className="loading-content">
                <div className="loading-spinner"></div>
                <p>부고장을 불러오는 중...</p>
            </div>
            <style jsx>{`
                .loading-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #FFFFFF;
                }
                .loading-content {
                    text-align: center;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #E5E5E5;
                    border-top-color: #FFD43B;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .loading-content p {
                    color: #888;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}
