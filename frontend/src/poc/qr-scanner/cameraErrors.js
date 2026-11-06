export function describeCameraError(error) {
  const name = error?.name ?? ''

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Quyền camera bị từ chối. Hãy cấp quyền camera cho trình duyệt rồi thử lại.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Không tìm thấy camera phù hợp trên thiết bị.'
  }
  if (!window.isSecureContext) {
    return 'Camera yêu cầu HTTPS hoặc localhost. Hãy mở trang qua một HTTPS origin đáng tin cậy.'
  }

  return `Không thể khởi động camera${error?.message ? `: ${error.message}` : '.'}`
}
