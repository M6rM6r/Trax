allprojects {
    repositories {
        google()
        mavenCentral()
        // flutter_background_geolocation ships tslocationmanager in its android/libs (resolved after flutter pub get)
        val pubCache = System.getenv("PUB_CACHE")
            ?: "${System.getenv("LOCALAPPDATA")}/Pub/Cache"
        file("$pubCache/hosted/pub.dev").listFiles()
            ?.filter { it.isDirectory && (it.name.startsWith("flutter_background_geolocation-") || it.name.startsWith("background_fetch-")) }
            ?.forEach { dir ->
                val libs = file("${dir.path}/android/libs")
                if (libs.exists()) {
                    maven { url = uri(libs) }
                }
            }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
