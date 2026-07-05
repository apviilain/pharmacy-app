if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/599adc772efef2bf9207f97b163a11a9/transformed/hermes-android-250829098.0.9-release/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/599adc772efef2bf9207f97b163a11a9/transformed/hermes-android-250829098.0.9-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

