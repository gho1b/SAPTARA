import { ShipEvolution } from "../../components/ShipEvolution";
import { Navbar } from "../../components/Navbar";
import { useStudentInfo } from "../../hooks/use-auth";
import { useStudentAccessories, usePurchaseAccessory } from "../../hooks/use-rewards";
import { useStudent } from "../../hooks/use-students";

/**
 * Student Ship Page
 *
 * Displays the student's ship evolution (level + XP) and
 * accessory shop where students can purchase items with coins.
 */
export function ShipPage() {
  const studentInfo = useStudentInfo();
  const studentId = studentInfo?.studentId ?? 0;
  const { data: student } = useStudent(studentId);
  const { data: accessories } = useStudentAccessories(studentId);
  const purchaseAccessory = usePurchaseAccessory(studentId);

  const handlePurchase = (accessoryId: string) => {
    purchaseAccessory.mutate({ accessoryId });
  };

  return (
    <div className="student-page" id="student-ship-page">
      <div className="page-header">
        <h1 className="page-title">⛵ Kapalku</h1>
        <p className="page-subtitle">Evolusi kapal dan toko aksesoris</p>
      </div>

      <ShipEvolution studentId={studentId} />

      <div className="accessory-shop">
        <h3 className="section-title">🛒 Toko Aksesoris</h3>
        <p className="shop-coins">🪙 Koin tersedia: {student?.coins ?? 0}</p>

        <div className="accessories-grid">
          {accessories?.map((acc) => {
            const canAfford = (student?.coins ?? 0) >= acc.price;

            return (
              <div key={acc.id} className={`accessory-card ${acc.owned ? "owned" : ""}`}>
                <span className="accessory-card__icon">{acc.icon}</span>
                <span className="accessory-card__name">{acc.name}</span>
                <span className="accessory-card__price">🪙 {acc.price}</span>
                {acc.owned ? (
                  <span className="accessory-card__badge">✅ Dimiliki</span>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handlePurchase(acc.id)}
                    disabled={!canAfford || purchaseAccessory.isPending}
                    type="button"
                  >
                    {purchaseAccessory.isPending ? "..." : "Beli"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {purchaseAccessory.isError && (
          <p className="error-text">❌ {purchaseAccessory.error.message}</p>
        )}
      </div>

      <Navbar role="student" />
    </div>
  );
}
