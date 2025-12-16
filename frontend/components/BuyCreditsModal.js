import { useState, useEffect } from "react";
import {
  getCreditPackages,
  initializePayment,
  verifyPayment,
} from "../lib/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";

export default function BuyCreditsModal({ isOpen, onClose, onSuccess }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  useEffect(() => {
    // Check for payment verification on mount
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    const paymentStatus = urlParams.get("payment");

    if (reference && paymentStatus === "success") {
      handlePaymentVerification(reference);
    }
  }, []);

  const loadPackages = async () => {
    try {
      const data = await getCreditPackages();
      setPackages(data);
    } catch (error) {
      console.error("Failed to load packages:", error);
      toast.error("Failed to load credit packages");
    }
  };

  const handlePaymentVerification = async (reference) => {
    try {
      const result = await verifyPayment(reference);
      if (result.success) {
        toast.success(result.message || "Payment successful!");
        if (onSuccess) onSuccess();

        // Clean up URL
        router.replace(router.pathname, undefined, { shallow: true });
      } else {
        toast.error(result.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Failed to verify payment");
    }
  };

  const handlePurchase = async (pkg) => {
    setLoading(true);
    setSelectedPackage(pkg.id);

    try {
      const result = await initializePayment(pkg.id);

      // Redirect to Paystack checkout
      window.location.href = result.authorization_url;
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error(
        error.response?.data?.message || "Failed to initialize payment"
      );
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Buy Credits</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`package-card ${pkg.popular ? "popular" : ""}`}
            >
              {pkg.popular && <div className="popular-badge">Most Popular</div>}

              <div className="package-credits">{pkg.credits}</div>
              <div className="package-label">Credits</div>

              <div className="package-price">₦{pkg.price.toLocaleString()}</div>
              <div className="package-rate">
                ₦{(pkg.price / pkg.credits).toFixed(2)} per credit
              </div>

              <button
                className="purchase-btn"
                onClick={() => handlePurchase(pkg)}
                disabled={loading}
              >
                {loading && selectedPackage === pkg.id ? (
                  <span className="spinner">Processing...</span>
                ) : (
                  "Purchase"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="payment-info">
          <p>💳 Secure payment powered by Paystack</p>
          <p>✅ Credits are added instantly after payment</p>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          padding: 30px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .modal-header h2 {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: #fff;
          font-size: 36px;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: rotate(90deg);
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .package-card {
          background: linear-gradient(135deg, #2d3561 0%, #1f2544 100%);
          border-radius: 15px;
          padding: 25px;
          text-align: center;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .package-card:hover {
          transform: translateY(-5px);
          border-color: #4a90e2;
          box-shadow: 0 10px 30px rgba(74, 144, 226, 0.3);
        }

        .package-card.popular {
          border-color: #ffd700;
          background: linear-gradient(135deg, #3d4771 0%, #2f3554 100%);
        }

        .popular-badge {
          position: absolute;
          top: 10px;
          right: -30px;
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #1a1a2e;
          padding: 5px 40px;
          font-size: 12px;
          font-weight: 700;
          transform: rotate(45deg);
          box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
        }

        .package-credits {
          font-size: 48px;
          font-weight: 800;
          color: #4a90e2;
          margin-bottom: 5px;
        }

        .package-label {
          color: #aaa;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .package-price {
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 5px;
        }

        .package-rate {
          color: #888;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .purchase-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #4a90e2, #357abd);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .purchase-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #357abd, #2868a8);
          transform: scale(1.05);
        }

        .purchase-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
        }

        .payment-info {
          background: rgba(74, 144, 226, 0.1);
          border-radius: 10px;
          padding: 20px;
          text-align: center;
        }

        .payment-info p {
          color: #aaa;
          margin: 5px 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .packages-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            padding: 20px;
          }

          .modal-header h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
