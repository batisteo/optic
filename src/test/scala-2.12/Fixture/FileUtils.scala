package Fixture

trait FileUtils {
  def getCurrentDirectory = new java.io.File(".").getCanonicalPath
}
