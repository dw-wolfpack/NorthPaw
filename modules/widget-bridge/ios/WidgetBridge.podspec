Pod::Spec.new do |s|
  s.name           = 'WidgetBridge'
  s.version        = '1.0.0'
  s.summary        = 'Native bridge to trigger iOS Widget timeline reloads'
  s.description    = 'Native bridge to trigger iOS Widget timeline reloads'
  s.author         = 'NorthPaw'
  s.homepage       = 'https://github.com/dw-wolfpack/NorthPaw'
  s.platform       = :ios, '13.4'
  s.source         = { :path => '.' }
  s.source_files   = '**/*.{h,m,swift}'
  s.dependency 'ExpoModulesCore'
end
