import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="CareerBridge"
                width={32}
                height={32}
                className="w-8 h-8 object-cover rounded-full"
              />
              <span className="font-bold text-xl">
                CareerBridge
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nền tảng tuyển dụng thân thiện, kết nối người tìm việc với nhà tuyển dụng
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Người Tìm Việc</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">
                  Tìm Việc Làm
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                  Hồ Sơ Của Tôi
                </Link>
              </li>
              <li>
                <Link href="/applications" className="text-muted-foreground hover:text-primary transition-colors">
                  Đơn Ứng Tuyển
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Nhà Tuyển Dụng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Bảng Giá
                </Link>
              </li>
              <li>
                <Link href="/dashboard/employer" className="text-muted-foreground hover:text-primary transition-colors">
                  Đăng Tin Tuyển Dụng
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Về Chúng Tôi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Hỗ Trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Liên Hệ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  Câu Hỏi Thường Gặp
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Điều Khoản Sử Dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CareerBridge. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
