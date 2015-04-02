(ns closure-dep-graph
  (:require [clojure.java.io :as io])
  (:import [java.io File]
           [com.google.javascript.jscomp SourceFile BasicErrorManager]
           [com.google.javascript.jscomp.deps DepsGenerator DepsGenerator$InclusionStrategy]))

(defn js-files-in
  "Return a sequence of all .js files in the given directory."
  [dir]
  (filter
    #(let [name (.getName ^File %)]
       (and (.endsWith name ".js")
            (not= \. (first name))))
    (file-seq dir)))

(spit (io/file "deps/closure-library/closure/goog/transducers_dep_graph.js")
  (.computeDependencyCalls
    (DepsGenerator. (map #(SourceFile/fromFile (io/file %)) '("deps/closure-library/closure/goog/deps.js"))
      (map #(SourceFile/fromFile %)
        (mapcat (comp js-files-in io/file)
          ["src"]))
      DepsGenerator$InclusionStrategy/ALWAYS
      (.getAbsolutePath (io/file "deps/closure-library/closure/goog"))
      (proxy [BasicErrorManager] []
        (report [level error]
          (println error))
        (println [level error]
          (println error))))))