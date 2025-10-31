import { Card, CardContent } from "@/components/ui/card"
import { Users, Target, Heart, Award } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Về CareerBridge</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CareerBridge là nền tảng tuyển dụng được thiết kế đặc biệt để phục vụ người dùng Việt Nam, với giao diện thân
            thiện và dễ sử dụng
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Sứ Mệnh Của Chúng Tôi</h2>
            <p className="text-muted-foreground leading-relaxed">
              Chúng tôi tin rằng mọi người đều xứng đáng có cơ hội tìm được công việc phù hợp, bất kể trình độ công nghệ
              của họ. CareerBridge được xây dựng với mục tiêu làm cho quá trình tìm việc và tuyển dụng trở nên đơn giản,
              minh bạch và hiệu quả hơn bao giờ hết.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thân Thiện Với Người Dùng</h3>
              <p className="text-muted-foreground">
                Giao diện đơn giản, dễ hiểu, phù hợp với mọi đối tượng người dùng, kể cả những người ít am hiểu công
                nghệ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hiệu Quả Cao</h3>
              <p className="text-muted-foreground">
                Hệ thống lọc và tìm kiếm thông minh giúp kết nối ứng viên với nhà tuyển dụng một cách nhanh chóng và
                chính xác
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Miễn Phí Cho Người Tìm Việc</h3>
              <p className="text-muted-foreground">
                Hoàn toàn miễn phí cho người tìm việc, không có chi phí ẩn, giúp mọi người đều có cơ hội tiếp cận việc
                làm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Uy Tín & Chất Lượng</h3>
              <p className="text-muted-foreground">
                Tất cả bài đăng tuyển dụng đều được kiểm duyệt kỹ lưỡng để đảm bảo chất lượng và tính xác thực
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">Liên Hệ Với Chúng Tôi</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <strong className="text-foreground">Email:</strong> support@vieclam.vn
              </p>
              <p>
                <strong className="text-foreground">Điện thoại:</strong> 1900 xxxx
              </p>
              <p>
                <strong className="text-foreground">Địa chỉ:</strong> Hà Nội, Việt Nam
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
