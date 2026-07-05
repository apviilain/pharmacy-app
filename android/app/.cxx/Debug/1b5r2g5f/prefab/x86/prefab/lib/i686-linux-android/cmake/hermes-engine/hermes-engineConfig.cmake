if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/7dfd13c2c7f3bfb4d94b33d9feea9cb9/transformed/hermes-android-250829098.0.9-debug/prefab/modules/hermesvm/libs/android.x86/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/akshaypanchal/.gradle/caches/9.0.0/transforms/7dfd13c2c7f3bfb4d94b33d9feea9cb9/transformed/hermes-android-250829098.0.9-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

