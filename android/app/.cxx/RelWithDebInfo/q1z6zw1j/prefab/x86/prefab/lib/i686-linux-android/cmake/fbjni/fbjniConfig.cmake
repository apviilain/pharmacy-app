if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/6be7d8c2dd47ecc2d64b5424b50ecb09/transformed/fbjni-0.7.0/prefab/modules/fbjni/libs/android.x86/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/6be7d8c2dd47ecc2d64b5424b50ecb09/transformed/fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

