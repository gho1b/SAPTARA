<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Piagam Kebiasaan Baru</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #fffbeb; margin: 0; padding: 20px; color: #1e293b;">
    <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fde68a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px 20px; text-align: center; color: #ffffff;">
            <span style="font-size: 42px; display: block; margin-bottom: 8px;">🎖️</span>
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">PIAGAM PENGHARGAAN</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.95;">SAPTARA — 7 Kebiasaan Anak Indonesia Hebat</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px 20px;">
            <p style="font-size: 15px; margin-top: 0;">Yth. Orang Tua / Wali dari <strong>{{ $student->name }}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
                Kami ucapkan selamat yang sebesar-besarnya! Ananda telah berhasil meraih <strong>Piagam Penghargaan Karakter</strong> atas konsistensinya dalam pembiasaan:
            </p>

            <div style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; display: block; margin-bottom: 6px;">{{ $habit->icon ?? '⭐' }}</span>
                <h3 style="margin: 0; font-size: 18px; color: #b45309;">{{ $habit->badge ?? $habit->name }}</h3>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #92400e;">Gugus {{ $habit->island ?? 'Kebiasaan Mulia' }}</p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
                <p style="font-size: 13px; color: #64748b;">
                    Terima kasih atas bimbingan dan teladan yang Ayah dan Bunda berikan di rumah. Semoga kebiasaan baik ini terus bertumbuh menjadi karakter mulia ananda seumur hidup.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #fffbeb; border-top: 1px solid #fef3c7; padding: 14px 20px; text-align: center; font-size: 12px; color: #b45309;">
            Diberikan oleh Guru Kelas {{ $student->class?->class_code }} • SAPTARA Pelayaran Karakter
        </div>

    </div>
</body>
</html>
