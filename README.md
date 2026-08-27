# Cách dùng rất ngắn

## Cấu trúc local

Để các folder cạnh nhau:

```text
project/
├─ pntt_output/
│  └─ chapters/
├─ pntt_part2_output/
│  └─ chapters/
└─ pntt-reader/
```

## Build data

Đứng ở `project/`:

```powershell
py pntt-reader/build_data.py
```

Nếu folder nằm chỗ khác:

```powershell
py pntt-reader/build_data.py --part1 "D:\...\pntt_output\chapters" --part2 "D:\...\pntt_part2_output\chapters" --web "D:\...\pntt-reader"
```

Sau build, `pntt-reader/data/` sẽ có đủ JSON.

## Tạo live URL bằng GitHub Pages

1. Tạo repo GitHub mới, ví dụ `pntt-reader`.
2. Upload **toàn bộ nội dung bên trong folder `pntt-reader`** lên root repo.
3. Repo → Settings → Pages.
4. Source: `Deploy from a branch`.
5. Branch: `main`, folder: `/(root)`.
6. Save.

URL sẽ dạng:

`https://USERNAME.github.io/pntt-reader/`

## Điện thoại

Android Chrome:
`⋮` → Add to Home screen / Install app.

iPhone Safari:
Share → Add to Home Screen.

Trong web có nút **Tải phần này để đọc offline**. Lần đầu cần mạng; sau khi tải xong phần đó thì đọc offline được.

Lưu ý: GitHub Pages là public. Nếu dữ liệu không nên public thì không dùng cách host này.
